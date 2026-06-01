package com.softwaredesign.schoolsystem.domain.counseling.repository;

import com.softwaredesign.schoolsystem.domain.counseling.entity.Counseling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CounselingRepository extends JpaRepository<Counseling, Long> {
    List<Counseling> findByStudentId(Long studentId);
    List<Counseling> findByTeacherId(Long teacherId);
    List<Counseling> findByStudentIdAndIsSharedTrue(Long studentId);
    List<Counseling> findByIsSharedTrue();
    long countByStudentId(Long studentId);

    @Query("select c from Counseling c "
            + "where c.isShared = true "
            + "and (:teacherId is null or c.teacher.id = :teacherId) "
            + "and (:studentName is null or c.student.user.name like %:studentName%) "
            + "and c.counseledAt between :start and :end")
    List<Counseling> searchShared(@Param("studentName") String studentName,
                                  @Param("teacherId") Long teacherId,
                                  @Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);

    /**
     * 공유된 상담 OR 요청 교사 본인이 작성한 상담(비공개 포함)을 함께 조회.
     * 본인이 공유를 해제해도 작성자에게는 계속 보이도록 한다.
     */
    @Query("select c from Counseling c "
            + "where (c.isShared = true or c.teacher.id = :requesterId) "
            + "and (:teacherId is null or c.teacher.id = :teacherId) "
            + "and (:studentName is null or c.student.user.name like %:studentName%) "
            + "and c.counseledAt between :start and :end")
    List<Counseling> searchVisible(@Param("requesterId") Long requesterId,
                                   @Param("studentName") String studentName,
                                   @Param("teacherId") Long teacherId,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end);
}
