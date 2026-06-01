package com.softwaredesign.schoolsystem.domain.approval.service;

import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalCreateRequest;
import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalResponse;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalRequest;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import com.softwaredesign.schoolsystem.domain.approval.repository.ApprovalRequestRepository;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.entity.School;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.AdminRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.SchoolRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.entity.Parent;
import com.softwaredesign.schoolsystem.domain.student.entity.ParentStudent;
import com.softwaredesign.schoolsystem.domain.student.entity.Relationship;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.ParentStudentRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import org.springframework.security.access.AccessDeniedException;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalRequestService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final ClassGroupRepository classGroupRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final NotificationService notificationService;

    @Transactional
    public ApprovalResponse create(ApprovalCreateRequest req, Long userId) {
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        ApprovalRequest request = ApprovalRequest.create(
                requester, req.getRequestType(), req.getRequestDetail());
        approvalRequestRepository.save(request);
        return ApprovalResponse.from(request);
    }

    @Transactional
    public ApprovalResponse createTransfer(Long userId, Long toSchoolId, RequestType type, String detail) {
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        School toSchool = schoolRepository.findById(toSchoolId)
                .orElseThrow(() -> new IllegalArgumentException("학교를 찾을 수 없습니다."));

        // 현재 학교 찾기
        School fromSchool = null;
        if (type == RequestType.TEACHER_TRANSFER) {
            fromSchool = teacherRepository.findByUserId(userId)
                    .map(Teacher::getSchool)
                    .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        } else if (type == RequestType.STUDENT_TRANSFER) {
            fromSchool = studentRepository.findByUserIdAndIsDeletedFalse(userId)
                    .map(s -> s.getClassGroup() != null ? s.getClassGroup().getSchool() : null)
                    .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));
        }

        ApprovalRequest request = ApprovalRequest.createTransfer(requester, type, detail, fromSchool, toSchool);
        approvalRequestRepository.save(request);

        // 두 학교 admin에게 알림 (신청자 이름 포함)
        String who = requester.getName() + (type == RequestType.TEACHER_TRANSFER ? " 선생님" : " 학생");
        String act = type == RequestType.TEACHER_TRANSFER ? "전근" : "전학";
        notifySchoolAdmin(fromSchool, act + " 신청", who + "이 " + act + " 신청을 했습니다.");
        notifySchoolAdmin(toSchool, act + " 수락 요청", who + "의 " + act + " 수락 요청이 접수되었습니다.");

        return ApprovalResponse.from(request);
    }

    public List<ApprovalResponse> getAll(ApprovalStatus statusOrNull, RequestType typeOrNull) {
        List<ApprovalRequest> list;
        if (statusOrNull != null && typeOrNull != null) {
            list = approvalRequestRepository.findByStatusAndRequestType(statusOrNull, typeOrNull);
        } else if (statusOrNull != null) {
            list = approvalRequestRepository.findByStatus(statusOrNull);
        } else if (typeOrNull != null) {
            list = approvalRequestRepository.findByRequestType(typeOrNull);
        } else {
            list = approvalRequestRepository.findAll();
        }
        return list.stream().map(ApprovalResponse::from).toList();
    }

    public List<ApprovalResponse> getBySchoolForAdmin(Long adminUserId, ApprovalStatus statusOrNull) {
        Long schoolId = adminRepository.findByUserId(adminUserId)
                .map(a -> a.getSchool().getId())
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보를 찾을 수 없습니다."));
        return getBySchool(schoolId, statusOrNull);
    }

    public List<ApprovalResponse> getBySchool(Long schoolId, ApprovalStatus statusOrNull) {
        List<ApprovalRequest> list = statusOrNull != null
                ? approvalRequestRepository.findBySchoolAndStatus(schoolId, statusOrNull)
                : approvalRequestRepository.findByFromSchoolIdOrToSchoolId(schoolId, schoolId);
        return list.stream().map(ApprovalResponse::from).toList();
    }

    @Transactional
    public ApprovalResponse process(Long requestId, ApprovalStatus status, Long approverUserId) {
        ApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("승인 요청을 찾을 수 없습니다."));
        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new IllegalArgumentException("승인자를 찾을 수 없습니다."));

        request.process(approver, status);

        notificationService.notify(
                request.getRequester().getId(),
                NotificationEventType.APPROVAL,
                "승인 요청 처리 결과",
                "승인 요청이 " + status.name() + " 처리되었습니다.");

        return ApprovalResponse.from(request);
    }

    @Transactional
    public ApprovalResponse processTransfer(Long requestId, boolean approve, Long adminUserId) {
        ApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("승인 요청을 찾을 수 없습니다."));

        // 어느 학교 admin인지 파악
        Long adminSchoolId = adminRepository.findByUserId(adminUserId)
                .map(a -> a.getSchool().getId())
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보를 찾을 수 없습니다."));

        boolean isFromSchool = request.getFromSchool() != null &&
                request.getFromSchool().getId().equals(adminSchoolId);
        boolean isToSchool = request.getToSchool() != null &&
                request.getToSchool().getId().equals(adminSchoolId);

        if (!isFromSchool && !isToSchool) {
            throw new IllegalArgumentException("해당 승인 요청에 대한 권한이 없습니다.");
        }

        if (approve) {
            if (isFromSchool) request.approveFromSchool();
            else request.approveToSchool();
        } else {
            if (isFromSchool) request.rejectFromSchool();
            else request.rejectToSchool();
        }

        // 둘 다 승인되면 실제 처리
        boolean executed = false;
        if (request.isBothApproved()) {
            executeTransfer(request);
            executed = true;
        }

        // 전근/전학은 보내는 학교·받는 학교 양쪽 승인이 필요 → 어느 단계인지 명확히 안내
        String act = request.getRequestType() == RequestType.TEACHER_TRANSFER ? "전근" : "전학";
        String sideName = isFromSchool
                ? (request.getFromSchool() != null ? request.getFromSchool().getSchoolName() : "보내는 학교")
                : (request.getToSchool() != null ? request.getToSchool().getSchoolName() : "받는 학교");
        String message;
        if (!approve) {
            message = sideName + "에서 거절하여 " + act + " 신청이 반려되었습니다.";
        } else if (executed) {
            message = "양쪽 학교가 모두 승인하여 " + act + "이 최종 완료되었습니다.";
        } else {
            message = sideName + "에서 승인했습니다. 나머지 학교의 승인을 기다리는 중입니다.";
        }

        notificationService.notify(
                request.getRequester().getId(),
                NotificationEventType.APPROVAL,
                act + " 승인 결과",
                message);

        return ApprovalResponse.from(request);
    }

    private void executeTransfer(ApprovalRequest request) {
        if (request.getRequestType() == RequestType.TEACHER_TRANSFER) {
            Teacher teacher = teacherRepository.findByUserId(request.getRequester().getId())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            teacher.assignSchool(request.getToSchool());
            // 이전 학교 데이터 비공개 처리 (학년/반 초기화)
            request.getRequester().updateSchoolName(request.getToSchool().getSchoolName());
        } else if (request.getRequestType() == RequestType.STUDENT_TRANSFER) {
            Student student = studentRepository.findByUserIdAndIsDeletedFalse(request.getRequester().getId())
                    .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
            // 전학 처리: 반 배정 초기화
            student.transferToSchool();
            request.getRequester().updateSchoolName(request.getToSchool().getSchoolName());
        }
    }

    public List<ApprovalResponse> getClassRegistrations(Long teacherUserId) {
        Teacher teacher = teacherRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        ClassGroup cg = classGroupRepository.findByHomeroomTeacherIdAndIsDeletedFalse(teacher.getId())
                .orElseThrow(() -> new AccessDeniedException("담임 학급이 지정되지 않았습니다."));
        String cgIdStr = "classGroupId:" + cg.getId();
        return approvalRequestRepository.findByStatus(ApprovalStatus.PENDING).stream()
                .filter(a -> a.getRequestType() == RequestType.STUDENT_REGISTRATION
                        || a.getRequestType() == RequestType.PARENT_REGISTRATION)
                .filter(a -> a.getRequestDetail() != null && a.getRequestDetail().contains(cgIdStr))
                .map(ApprovalResponse::from)
                .toList();
    }

    @Transactional
    public ApprovalResponse processClassRegistration(Long approvalId, Long teacherUserId, boolean approve) {
        Teacher teacher = teacherRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        ClassGroup cg = classGroupRepository.findByHomeroomTeacherIdAndIsDeletedFalse(teacher.getId())
                .orElseThrow(() -> new AccessDeniedException("담임 학급이 지정되지 않았습니다."));
        ApprovalRequest req = approvalRequestRepository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("승인 요청을 찾을 수 없습니다."));

        req.process(teacher.getUser(), approve ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);

        if (approve) {
            User requester = req.getRequester();
            requester.approve();
            if (req.getRequestType() == RequestType.STUDENT_REGISTRATION) {
                String detail = req.getRequestDetail();
                int studentNum = parseDetailInt(detail, "번호");
                studentRepository.findByUserIdAndIsDeletedFalse(requester.getId()).ifPresent(s ->
                        s.updateStudent(cg, studentNum));
            } else if (req.getRequestType() == RequestType.PARENT_REGISTRATION) {
                parentRepository.findByUserIdAndIsDeletedFalse(requester.getId()).ifPresent(p -> {
                    String detail = req.getRequestDetail();
                    int studentNum = parseDetailInt(detail, "번호");
                    studentRepository.findAllByClassGroupIdAndIsDeletedFalse(cg.getId()).stream()
                            .filter(s -> s.getStudentNumber() == studentNum)
                            .findFirst()
                            .ifPresent(s -> parentStudentRepository.save(
                                    ParentStudent.createParentStudent(s, p, Relationship.GUARDIAN)));
                });
            }
        }
        return ApprovalResponse.from(req);
    }

    private int parseDetailInt(String detail, String key) {
        try {
            for (String part : detail.split("\\|")) {
                if (part.startsWith(key + ":")) return Integer.parseInt(part.split(":")[1]);
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private void notifySchoolAdmin(School school, String title, String message) {
        if (school == null) return;
        adminRepository.findBySchoolId(school.getId()).ifPresent(admin ->
                notificationService.notify(admin.getUser().getId(), NotificationEventType.APPROVAL,
                        title, message));
    }
}
