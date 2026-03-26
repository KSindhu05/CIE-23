package com.example.ia.repository;

import com.example.ia.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRegNo(String regNo);

    Optional<Student> findByRegNoIgnoreCase(String regNo);

    boolean existsByRegNo(String regNo);

    List<Student> findByDepartment(String department);

    List<Student> findByDepartmentAndSemester(String department, Integer semester);

    @Query("SELECT DISTINCT s.section FROM Student s WHERE s.department = :department AND s.semester = :semester AND s.section IS NOT NULL AND s.section != ''")
    List<String> findDistinctSectionsByDepartmentAndSemester(@Param("department") String department,
            @Param("semester") Integer semester);

    List<Student> findBySectionIn(Collection<String> sections);

    List<Student> findByDepartmentIn(Collection<String> departments);

    List<Student> findByDepartmentInAndSectionIn(Collection<String> departments, Collection<String> sections);

    long countByDepartment(String department);

    @Modifying
    @Transactional
    @Query("UPDATE Student s SET s.semester = :toSem WHERE s.semester = :fromSem")
    int updateSemester(@Param("fromSem") Integer fromSem, @Param("toSem") Integer toSem);

    @Modifying
    @Transactional
    @Query("UPDATE Student s SET s.semester = CASE WHEN s.semester < 6 THEN s.semester + 1 ELSE 1 END WHERE s.semester IS NOT NULL")
    int shiftAllSemesters();

    @Modifying
    @Transactional
    @Query("UPDATE Student s SET s.semester = CASE WHEN s.semester < 6 THEN s.semester + 1 ELSE 1 END WHERE s.semester = :targetSem")
    int shiftSpecificSemester(@Param("targetSem") Integer targetSem);

    @Modifying
    @Transactional
    @Query("DELETE FROM Student s WHERE s.semester = :semester")
    void deleteBySemester(@Param("semester") Integer semester);
}
