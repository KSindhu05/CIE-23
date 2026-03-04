package com.example.ia.controller;

import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.entity.FacultyAssignmentRequest;
import com.example.ia.repository.AnnouncementRepository;
import com.example.ia.repository.AttendanceRepository;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import com.example.ia.repository.FacultyAssignmentRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    CieMarkRepository cieMarkRepository;

    @Autowired
    AttendanceRepository attendanceRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    FacultyAssignmentRequestRepository assignmentRequestRepository;

    @Autowired
    AnnouncementRepository announcementRepository;

    @GetMapping("/department/{department}")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL') or hasRole('FACULTY')")
    public List<Subject> getSubjectsByDepartment(@PathVariable String department) {
        return subjectRepository.findByDepartment(department);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> createSubject(@RequestBody Map<String, Object> data) {
        String name = data.getOrDefault("name", "").toString().trim();
        String code = data.getOrDefault("code", "").toString().trim();
        String department = data.getOrDefault("department", "").toString().trim();

        if (name.isEmpty() || code.isEmpty() || department.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Subject name, code, and department are required."));
        }

        // Check for duplicate code in the same department
        if (subjectRepository.findByCodeAndDepartment(code, department).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "A subject with code '" + code + "' already exists in the " + department + " department."));
        }

        Subject subject = new Subject();
        subject.setName(name);
        subject.setCode(code);
        subject.setDepartment(department);
        if (data.containsKey("semester") && data.get("semester") != null) {
            subject.setSemester(Integer.parseInt(data.get("semester").toString()));
        }
        if (data.containsKey("credits") && data.get("credits") != null) {
            subject.setCredits(Integer.parseInt(data.get("credits").toString()));
        }
        if (data.containsKey("instructorName") && data.get("instructorName") != null) {
            subject.setInstructorName(data.get("instructorName").toString().trim());
        }

        subjectRepository.save(subject);
        return ResponseEntity.ok(subject);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    @Transactional
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        if (subjectRepository.existsById(id)) {
            // Delete related records first to avoid foreign key constraints
            cieMarkRepository.deleteBySubject_Id(id);
            attendanceRepository.deleteBySubjectId(id);
            announcementRepository.deleteBySubjectId(id);

            subjectRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Subject deleted successfully (cascading cleanup completed)"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    @Transactional
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return subjectRepository.findById(id).map(subject -> {
            String name = data.getOrDefault("name", "").toString().trim();
            String code = data.getOrDefault("code", "").toString().trim();

            if (name.isEmpty() || code.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Subject name and code are required."));
            }

            // Check if code is being changed and if new code already exists in the same
            // department
            if (!subject.getCode().equals(code)
                    && subjectRepository.findByCodeAndDepartment(code, subject.getDepartment()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "A subject with code '" + code + "' already exists in the "
                                + subject.getDepartment() + " department."));
            }

            String oldName = subject.getName();
            boolean nameChanged = !oldName.equals(name);

            subject.setName(name);
            subject.setCode(code);

            if (data.containsKey("semester") && data.get("semester") != null) {
                subject.setSemester(Integer.parseInt(data.get("semester").toString()));
            }
            if (data.containsKey("instructorName") && data.get("instructorName") != null) {
                subject.setInstructorName(data.get("instructorName").toString().trim());
            }

            subjectRepository.save(subject);

            // Sync the updated subject name across User and FacultyAssignmentRequest
            // assignments
            if (nameChanged) {
                List<User> users = userRepository.findAll();
                for (User u : users) {
                    if (u.getSubjects() != null && !u.getSubjects().isBlank()) {
                        String updatedSubjects = updateSubjectList(u.getSubjects(), oldName, name);
                        if (!updatedSubjects.equals(u.getSubjects())) {
                            u.setSubjects(updatedSubjects);
                            userRepository.save(u);
                        }
                    }
                }

                List<FacultyAssignmentRequest> requests = assignmentRequestRepository.findAll();
                for (FacultyAssignmentRequest r : requests) {
                    if (r.getSubjects() != null && !r.getSubjects().isBlank()) {
                        String updatedSubjects = updateSubjectList(r.getSubjects(), oldName, name);
                        if (!updatedSubjects.equals(r.getSubjects())) {
                            r.setSubjects(updatedSubjects);
                            assignmentRequestRepository.save(r);
                        }
                    }
                }
            }

            return ResponseEntity.ok(subject);
        }).orElse(ResponseEntity.notFound().build());
    }

    private String updateSubjectList(String subjectsStr, String oldName, String newName) {
        String[] parts = subjectsStr.split(",");
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].trim().equalsIgnoreCase(oldName)) {
                parts[i] = newName;
            } else {
                parts[i] = parts[i].trim();
            }
        }
        return String.join(", ", parts);
    }
}
