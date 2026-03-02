package com.example.ia.payload.response;

import java.util.List;

public class FacultyClassAnalytics {
    private int evaluated;
    private int pending;
    private double avgScore;
    private int lowPerformers;
    private int topPerformers;
    private int totalStudents;
    private List<PerformanceRecord> excellentPerformersList;
    private List<PerformanceRecord> averagePerformersList;
    private List<PerformanceRecord> lowPerformersList;

    public FacultyClassAnalytics() {
    }

    public FacultyClassAnalytics(int evaluated, int pending, double avgScore, int lowPerformers, int topPerformers,
            int totalStudents, List<PerformanceRecord> excellentPerformersList,
            List<PerformanceRecord> averagePerformersList, List<PerformanceRecord> lowPerformersList) {
        this.evaluated = evaluated;
        this.pending = pending;
        this.avgScore = avgScore;
        this.lowPerformers = lowPerformers;
        this.topPerformers = topPerformers;
        this.totalStudents = totalStudents;
        this.excellentPerformersList = excellentPerformersList;
        this.averagePerformersList = averagePerformersList;
        this.lowPerformersList = lowPerformersList;
    }

    public int getEvaluated() {
        return evaluated;
    }

    public void setEvaluated(int evaluated) {
        this.evaluated = evaluated;
    }

    public int getPending() {
        return pending;
    }

    public void setPending(int pending) {
        this.pending = pending;
    }

    public double getAvgScore() {
        return avgScore;
    }

    public void setAvgScore(double avgScore) {
        this.avgScore = avgScore;
    }

    public int getLowPerformers() {
        return lowPerformers;
    }

    public void setLowPerformers(int lowPerformers) {
        this.lowPerformers = lowPerformers;
    }

    public int getTopPerformers() {
        return topPerformers;
    }

    public void setTopPerformers(int topPerformers) {
        this.topPerformers = topPerformers;
    }

    public List<PerformanceRecord> getExcellentPerformersList() {
        return excellentPerformersList;
    }

    public void setExcellentPerformersList(List<PerformanceRecord> excellentPerformersList) {
        this.excellentPerformersList = excellentPerformersList;
    }

    public List<PerformanceRecord> getAveragePerformersList() {
        return averagePerformersList;
    }

    public void setAveragePerformersList(List<PerformanceRecord> averagePerformersList) {
        this.averagePerformersList = averagePerformersList;
    }

    public List<PerformanceRecord> getLowPerformersList() {
        return lowPerformersList;
    }

    public void setLowPerformersList(List<PerformanceRecord> lowPerformersList) {
        this.lowPerformersList = lowPerformersList;
    }

    public int getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(int totalStudents) {
        this.totalStudents = totalStudents;
    }

    public static class PerformanceRecord {
        private String regNo;
        private String name;
        private String subject;
        private String cieType;
        private double score;
        private Double attendance;
        private String parentPhone;

        public PerformanceRecord() {
        }

        public PerformanceRecord(String regNo, String name, String subject, String cieType, double score,
                Double attendance,
                String parentPhone) {
            this.regNo = regNo;
            this.name = name;
            this.subject = subject;
            this.cieType = cieType;
            this.score = score;
            this.attendance = attendance;
            this.parentPhone = parentPhone;
        }

        public String getRegNo() {
            return regNo;
        }

        public void setRegNo(String regNo) {
            this.regNo = regNo;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getCieType() {
            return cieType;
        }

        public void setCieType(String cieType) {
            this.cieType = cieType;
        }

        public double getScore() {
            return score;
        }

        public void setScore(double score) {
            this.score = score;
        }

        public Double getAttendance() {
            return attendance;
        }

        public void setAttendance(Double attendance) {
            this.attendance = attendance;
        }

        public String getParentPhone() {
            return parentPhone;
        }

        public void setParentPhone(String parentPhone) {
            this.parentPhone = parentPhone;
        }
    }
}
