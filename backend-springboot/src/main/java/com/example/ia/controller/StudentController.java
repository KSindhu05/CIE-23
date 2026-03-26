package com.example.ia.controller;

import com.example.ia.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/student") // Match existing node route
public class StudentController {
    @Autowired
    StudentService studentService;

    @GetMapping("/all")
    public List<com.example.ia.payload.response.StudentResponse> getAllStudents(
            @RequestParam(required = false) String department) {
        return studentService.getStudentsWithAnalytics(department);
    }

    @GetMapping("/faculty")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public List<com.example.ia.payload.response.FacultyResponse> getFaculty() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return studentService.getFacultyForStudent(username);
    }

    @GetMapping("/profile")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public org.springframework.http.ResponseEntity<?> getProfile() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return studentService.getStudentProfile(username)
                .map(org.springframework.http.ResponseEntity::ok)
                .orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @GetMapping("/subjects")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public List<com.example.ia.entity.Subject> getSubjects() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return studentService.getSubjectsForStudent(username);
    }

    @PutMapping("/{id}/mentor")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FACULTY') or hasRole('HOD') or hasRole('ADMIN')")
    public org.springframework.http.ResponseEntity<?> updateMentor(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String mentorName = request.get("mentor");
        studentService.updateMentor(id, mentorName);
        return org.springframework.http.ResponseEntity.ok().build();
    }
}
