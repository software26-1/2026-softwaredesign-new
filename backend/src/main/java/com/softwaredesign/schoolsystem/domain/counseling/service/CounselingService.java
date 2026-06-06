package com.softwaredesign.schoolsystem.domain.counseling.service;

import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingCreateRequest;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingResponse;
import com.softwaredesign.schoolsystem.domain.counseling.dto.CounselingUpdateRequest;
import com.softwaredesign.schoolsystem.domain.counseling.entity.Counseling;
import com.softwaredesign.schoolsystem.auth.dto.AuthUser;
import com.softwaredesign.schoolsystem.domain.counseling.repository.CounselingRepository;
import com.softwaredesign.schoolsystem.domain.school.entity.Teacher;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.school.service.StudentAccessGuard;
import com.softwaredesign.schoolsystem.domain.student.entity.Student;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CounselingService {

    private static final LocalDateTime MIN_DATE = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime MAX_DATE = LocalDateTime.of(9999, 12, 31, 23, 59);

    private final CounselingRepository counselingRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final StudentAccessGuard studentAccessGuard;

    @Transactional
    public CounselingResponse create(CounselingCreateRequest request, Long userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 학교 격리: 같은 학교 학생만 상담 작성 가능
        Long teacherSchoolId = teacher.getSchool() != null ? teacher.getSchool().getId() : null;
        Long studentSchoolId = student.getSchool() != null ? student.getSchool().getId() : null;
        if (teacherSchoolId == null || studentSchoolId == null || !teacherSchoolId.equals(studentSchoolId)) {
            throw new AccessDeniedException("같은 학교 학생만 상담을 작성할 수 있습니다.");
        }

        Counseling counseling = Counseling.createCounseling(
                teacher, student, request.getCounseledAt(), request.getContent(), request.getNextPlan());
        if (request.getIsShared() != null) {
            counseling.setShared(request.getIsShared());
        }
        counselingRepository.save(counseling);
        return CounselingResponse.from(counseling);
    }

    public List<CounselingResponse> getByStudent(Long studentId, AuthUser authUser) {
        // 학교 격리: 교사는 같은 학교 학생만, 학생/학부모는 본인/자녀만
        studentAccessGuard.requireCanAccessStudent(authUser, studentId);
        return counselingRepository.findByStudentId(studentId).stream()
                .map(CounselingResponse::from)
                .toList();
    }

    public List<CounselingResponse> searchShared(String studentName, Long teacherId,
                                                 LocalDateTime start, LocalDateTime end) {
        LocalDateTime from = (start != null) ? start : MIN_DATE;
        LocalDateTime to = (end != null) ? end : MAX_DATE;
        return counselingRepository.searchShared(studentName, teacherId, from, to).stream()
                .map(CounselingResponse::from)
                .toList();
    }

    /** 공유된 상담 + 요청 교사 본인 상담(비공개 포함)을 함께 조회. */
    public List<CounselingResponse> searchVisible(Long userId, String studentName, Long teacherId,
                                                  LocalDateTime start, LocalDateTime end) {
        Teacher requester = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new AccessDeniedException("교사를 찾을 수 없습니다."));
        Long requesterTeacherId = requester.getId();
        Long requesterSchoolId = requester.getSchool() != null ? requester.getSchool().getId() : null;
        LocalDateTime from = (start != null) ? start : MIN_DATE;
        LocalDateTime to = (end != null) ? end : MAX_DATE;
        return counselingRepository.searchVisible(requesterTeacherId, studentName, teacherId, from, to).stream()
                // 학교 격리: 요청 교사와 같은 학교 학생의 상담만 노출
                .filter(c -> {
                    Long sSchool = (c.getStudent() != null && c.getStudent().getSchool() != null)
                            ? c.getStudent().getSchool().getId() : null;
                    return requesterSchoolId != null && requesterSchoolId.equals(sSchool);
                })
                .map(CounselingResponse::from)
                .toList();
    }

    @Transactional
    public CounselingResponse update(Long counselingId, CounselingUpdateRequest request, Long userId) {
        Counseling counseling = counselingRepository.findById(counselingId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다."));
        validateOwner(counseling, userId);

        counseling.updateCounseling(request.getCounseledAt(), request.getContent(), request.getNextPlan());
        if (request.getIsShared() != null && request.getIsShared() != counseling.isShared()) {
            counseling.setShared(request.getIsShared());
        }
        return CounselingResponse.from(counseling);
    }

    @Transactional
    public void delete(Long counselingId, Long userId) {
        Counseling counseling = counselingRepository.findById(counselingId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다."));
        validateOwner(counseling, userId);
        counselingRepository.delete(counseling);
    }

    private void validateOwner(Counseling counseling, Long userId) {
        if (!counseling.getTeacher().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 상담을 작성한 교사만 관리할 수 있습니다.");
        }
    }
}
