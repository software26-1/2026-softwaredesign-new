package com.softwaredesign.schoolsystem.domain.user.service;

import com.softwaredesign.schoolsystem.domain.school.entity.ClassGroup;
import com.softwaredesign.schoolsystem.domain.school.repository.ClassGroupRepository;
import com.softwaredesign.schoolsystem.domain.school.repository.TeacherRepository;
import com.softwaredesign.schoolsystem.domain.student.repository.StudentRepository;
import com.softwaredesign.schoolsystem.domain.user.dto.MyProfileResponse;
import com.softwaredesign.schoolsystem.domain.user.dto.MyProfileUpdateRequest;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.entity.UserRole;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileService {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final ClassGroupRepository classGroupRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public MyProfileResponse getProfile(Long userId) {
        User user = findUser(userId);
        if (user.getRole() == UserRole.TEACHER) {
            return teacherRepository.findByUserId(userId).map(teacher -> {
                Long curriculumId = teacher.getCurriculumId();
                String position = teacher.getPosition();
                return classGroupRepository.findByHomeroomTeacherIdAndIsDeletedFalse(teacher.getId())
                        .map(cg -> MyProfileResponse.from(user,
                                cg.getSchool() != null ? cg.getSchool().getId() : null,
                                cg.getId(), cg.getGrade(), cg.getClassNumber(), curriculumId, position))
                        .orElse(MyProfileResponse.fromTeacher(user, teacher.getSchool() != null ? teacher.getSchool().getId() : null, curriculumId, position));
            }).orElse(MyProfileResponse.from(user));
        }
        if (user.getRole() == UserRole.STUDENT) {
            return studentRepository.findByUserIdAndIsDeletedFalse(userId)
                    .map(s -> {
                        ClassGroup cg = s.getClassGroup();
                        if (cg == null) {
                            return MyProfileResponse.fromStudent(user, s.getId());
                        }
                        return MyProfileResponse.fromStudent(user, s.getId(),
                                cg.getSchool() != null ? cg.getSchool().getId() : null,
                                cg.getId(), cg.getGrade(), cg.getClassNumber(), s.getStudentNumber());
                    })
                    .orElse(MyProfileResponse.from(user));
        }
        return MyProfileResponse.from(user);
    }

    public MyProfileResponse updateProfile(Long userId, MyProfileUpdateRequest request) {
        User user = findUser(userId);
        user.updateProfile(request.getName(), request.getPhone());
        return MyProfileResponse.from(user);
    }

    public void updateCurriculum(Long userId, Long curriculumId) {
        teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."))
                .updateCurriculum(curriculumId);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
