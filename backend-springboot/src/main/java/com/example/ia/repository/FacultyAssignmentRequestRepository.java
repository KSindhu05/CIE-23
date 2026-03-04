package com.example.ia.repository;

import com.example.ia.entity.FacultyAssignmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacultyAssignmentRequestRepository extends JpaRepository<FacultyAssignmentRequest, Long> {

    List<FacultyAssignmentRequest> findByTargetDepartmentAndStatus(String targetDepartment, String status);

    List<FacultyAssignmentRequest> findByTargetDepartment(String targetDepartment);

    List<FacultyAssignmentRequest> findByFacultyId(Long facultyId);

    List<FacultyAssignmentRequest> findByFacultyIdAndTargetDepartmentAndStatus(Long facultyId, String targetDepartment,
            String status);

    List<FacultyAssignmentRequest> findByFacultyIdAndTargetDepartment(Long facultyId, String targetDepartment);

    List<FacultyAssignmentRequest> findByFacultyIdAndStatus(Long facultyId, String status);

    Long deleteByTargetDepartmentAndStatusIn(String targetDepartment, List<String> statuses);

    List<FacultyAssignmentRequest> findByTargetDepartmentAndStatusIn(String targetDepartment, List<String> statuses);
}
