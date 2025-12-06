package com.athletex.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.*

@Parcelize
data class Athlete(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val age: Int = 0,
    val weight: Double = 0.0,
    val height: Double = 0.0,
    val sportsPlayed: List<String> = emptyList(),
    val country: String = "",
    val state: String = "",
    val city: String = "",
    val pinCode: String = "",
    val profilePictureUrl: String = "",
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
) : Parcelable

@Parcelize
data class AssessmentTest(
    val id: String = "",
    val athleteId: String = "",
    val testType: TestType = TestType.SHOT_PUT,
    val videoUrl: String = "",
    val score: Double = 0.0,
    val timestamp: Date = Date(),
    val notes: String = ""
) : Parcelable

enum class TestType {
    SHOT_PUT,
    BROAD_JUMP,
    LONG_JUMP,
    SPRINT_100M,
    HIGH_JUMP,
    PUSH_UPS,
    PULL_UPS,
    SIT_UPS,
    PLANK,
    SHUTTLE_RUN,
    VERTICAL_JUMP,
    AGILITY_T_TEST
}

@Parcelize
data class PerformanceMetric(
    val id: String = "",
    val athleteId: String = "",
    val metricType: MetricType = MetricType.TIMING_100M,
    val value: Double = 0.0,
    val unit: String = "",
    val timestamp: Date = Date(),
    val notes: String = ""
) : Parcelable

enum class MetricType {
    TIMING_100M,
    TIMING_200M,
    TIMING_800M,
    LONG_JUMP,
    SHOT_PUT_DISTANCE
}

@Parcelize
data class TrainingProgram(
    val id: String = "",
    val sport: SportType = SportType.FOOTBALL,
    val title: String = "",
    val description: String = "",
    val exercises: List<Exercise> = emptyList(),
    val difficulty: DifficultyLevel = DifficultyLevel.BEGINNER,
    val duration: String = ""
) : Parcelable

@Parcelize
data class Exercise(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val duration: String = "",
    val reps: String = "",
    val imageUrl: String = ""
) : Parcelable

enum class SportType {
    FOOTBALL,
    BASKETBALL,
    HANDBALL,
    ATHLETICS,
    HOCKEY,
    KABADDI
}

enum class DifficultyLevel {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED
}

@Parcelize
data class SocialPost(
    val id: String = "",
    val athleteId: String = "",
    val athleteName: String = "",
    val athleteProfilePicture: String = "",
    val content: String = "",
    val mediaUrl: String = "",
    val mediaType: MediaType = MediaType.IMAGE,
    val likes: Int = 0,
    val likedBy: List<String> = emptyList(),
    val comments: List<Comment> = emptyList(),
    val timestamp: Date = Date()
) : Parcelable

@Parcelize
data class Comment(
    val id: String = "",
    val athleteId: String = "",
    val athleteName: String = "",
    val content: String = "",
    val timestamp: Date = Date()
) : Parcelable

enum class MediaType {
    IMAGE,
    VIDEO
}

@Parcelize
data class AdminFilter(
    val sport: SportType? = null,
    val minAge: Int? = null,
    val maxAge: Int? = null,
    val country: String = "",
    val state: String = "",
    val city: String = ""
) : Parcelable

@Parcelize
data class AthleteRanking(
    val athlete: Athlete,
    val totalScore: Double = 0.0,
    val rank: Int = 0,
    val isShortlisted: Boolean = false
) : Parcelable
