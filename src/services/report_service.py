import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from src.models.interview import Interview
from src.models.evaluation import Answer, SpeechMetrics, Evaluation


def generate_interview_report(db: Session, interview: Interview) -> Dict[str, Any]:
    # Query all answers for this interview
    answers = (
        db.query(Answer)
        .filter(Answer.interview_id == interview.id)
        .all()
    )

    question_results = []
    tech_scores = []
    rel_scores = []
    clar_scores = []
    comm_scores = []
    conf_scores = []
    overall_scores = []

    total_words_sum = 0
    total_duration_sum = 0.0
    total_fillers_sum = 0
    total_pauses_sum = 0
    total_long_pauses_sum = 0
    all_strengths = []
    all_improvements = []

    for idx, ans in enumerate(answers, start=1):
        eval_rec = ans.evaluation
        speech_rec = ans.speech_metrics

        e_tech = eval_rec.technical_score if eval_rec else 0
        e_rel = eval_rec.relevance_score if eval_rec else 0
        e_clar = eval_rec.clarity_score if eval_rec else 0
        e_comm = eval_rec.communication_score if eval_rec else 0
        e_conf = eval_rec.confidence_score if eval_rec else 0
        e_overall = eval_rec.overall_score if eval_rec else 0

        tech_scores.append(e_tech)
        rel_scores.append(e_rel)
        clar_scores.append(e_clar)
        comm_scores.append(e_comm)
        conf_scores.append(e_conf)
        overall_scores.append(e_overall)

        strengths_list = json.loads(eval_rec.strengths or "[]") if eval_rec else []
        improvements_list = json.loads(eval_rec.improvements or "[]") if eval_rec else []
        all_strengths.extend(strengths_list)
        all_improvements.extend(improvements_list)

        s_words = speech_rec.total_words if speech_rec else 0
        s_dur = speech_rec.duration_seconds if speech_rec else 0.0
        s_wpm = speech_rec.words_per_minute if speech_rec else 0.0
        s_fillers = speech_rec.filler_words if speech_rec else 0
        s_frate = speech_rec.filler_rate if speech_rec else 0.0
        s_repeats = speech_rec.repeated_words if speech_rec else 0
        s_pauses = speech_rec.pause_count if speech_rec else 0
        s_long_pauses = speech_rec.long_pause_count if speech_rec else 0
        s_avg_pause = speech_rec.average_pause_seconds if speech_rec else 0.0
        s_max_pause = speech_rec.longest_pause_seconds if speech_rec else 0.0

        total_words_sum += s_words
        total_duration_sum += s_dur
        total_fillers_sum += s_fillers
        total_pauses_sum += s_pauses
        total_long_pauses_sum += s_long_pauses

        question_results.append({
            "questionNumber": idx,
            "questionText": ans.question.text if ans.question else "",
            "answerText": ans.text or "",
            "transcript": ans.transcript or "",
            "audioSubmitted": bool(ans.audio_path or ans.transcript),
            "evaluation": {
                "technicalScore": e_tech,
                "relevanceScore": e_rel,
                "clarityScore": e_clar,
                "communicationScore": e_comm,
                "confidenceScore": e_conf,
                "overallScore": e_overall,
                "feedback": eval_rec.feedback if eval_rec else "",
                "strengths": strengths_list,
                "improvements": improvements_list
            },
            "speechMetrics": {
                "totalWords": s_words,
                "durationSeconds": s_dur,
                "wordsPerMinute": s_wpm,
                "fillerWords": s_fillers,
                "fillerRate": s_frate,
                "repeatedWords": s_repeats,
                "pauseCount": s_pauses,
                "longPauseCount": s_long_pauses,
                "averagePauseSeconds": s_avg_pause,
                "longestPauseSeconds": s_max_pause
            }
        })

    num_answers = len(answers) or 1
    avg_tech = int(round(sum(tech_scores) / num_answers))
    avg_rel = int(round(sum(rel_scores) / num_answers))
    avg_clar = int(round(sum(clar_scores) / num_answers))
    avg_comm = int(round(sum(comm_scores) / num_answers))
    avg_conf = int(round(sum(conf_scores) / num_answers))
    avg_overall = int(round(sum(overall_scores) / num_answers))

    # Update overall score on interview record
    interview.overall_score = float(avg_overall)
    db.commit()

    avg_wpm = round(total_words_sum / (total_duration_sum / 60.0), 2) if total_duration_sum > 0 else 0.0
    avg_filler_rate = round(total_fillers_sum / total_words_sum, 4) if total_words_sum > 0 else 0.0

    aggregated_speech = {
        "totalWords": total_words_sum,
        "durationSeconds": round(total_duration_sum, 2),
        "wordsPerMinute": avg_wpm,
        "fillerWords": total_fillers_sum,
        "fillerRate": avg_filler_rate,
        "repeatedWords": sum(qr["speechMetrics"]["repeatedWords"] for qr in question_results),
        "pauseCount": total_pauses_sum,
        "longPauseCount": total_long_pauses_sum,
        "averagePauseSeconds": round(sum(qr["speechMetrics"]["averagePauseSeconds"] for qr in question_results) / num_answers, 2),
        "longestPauseSeconds": max([qr["speechMetrics"]["longestPauseSeconds"] for qr in question_results] or [0.0])
    }

    # Generate actionable AI recommendations based on performance metrics
    recommendations = []
    if avg_tech < 75:
        recommendations.append(f"Review core CS fundamentals and domain concepts for {interview.role} interviews.")
    if avg_comm < 75 or avg_filler_rate > 0.03:
        recommendations.append("Practice speaking at a steady cadence and pause intentionally instead of using filler words ('um', 'like', 'basically').")
    if avg_clar < 75:
        recommendations.append("Use the STAR technique (Situation, Task, Action, Result) or structured framework for clear responses.")
    if total_long_pauses_sum > 3:
        recommendations.append("Take a brief 2-second pause to structure your thoughts before beginning your answer to eliminate long mid-sentence pauses.")
    if not recommendations:
        recommendations.append("Outstanding performance! Continue refining your system architecture examples and deep technical edge-case explanations.")

    # Deduplicate strengths & improvements
    unique_strengths = list(dict.fromkeys(all_strengths))[:5]
    unique_improvements = list(dict.fromkeys(all_improvements))[:5]

    return {
        "overallScore": avg_overall,
        "technicalScore": avg_tech,
        "communicationScore": avg_comm,
        "relevanceScore": avg_rel,
        "clarityScore": avg_clar,
        "confidenceScore": avg_conf,
        "speechMetrics": aggregated_speech,
        "questionResults": question_results,
        "strengths": unique_strengths if unique_strengths else ["Good technical communication attempt"],
        "improvements": unique_improvements if unique_improvements else ["Include more concrete code and architectural examples"],
        "recommendations": recommendations,
        "durationSeconds": round(total_duration_sum, 2),
        "role": interview.role,
        "interviewType": interview.interview_type
    }
