import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, HelpCircle } from 'lucide-react';
import { RoleSelector } from '../components/setup/RoleSelector';
import { ExperienceSelector } from '../components/setup/ExperienceSelector';
import { InterviewTypeSelector } from '../components/setup/InterviewTypeSelector';
import { SetupSummary } from '../components/setup/SetupSummary';
import { DIFFICULTIES, QUESTION_COUNTS } from '../mock/setup';
import { interviewsApi } from '../api/interviews';

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Software Engineer');
  const [experience, setExperience] = useState('Mid-Level');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      const createRes = await interviewsApi.create({
        role,
        experience,
        difficulty,
        interviewType,
        numberOfQuestions: numQuestions,
      });

      const interviewId = createRes.interview.id;
      await interviewsApi.start(interviewId);
      navigate(`/interview/${interviewId}`);
    } catch (error) {
      console.error('Failed to create/start interview session:', error);
      navigate(`/interview/demo-session-id`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configure Your Interview</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Customize the mock session to match your target role and preparation needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <RoleSelector selectedRole={role} onSelectRole={setRole} />
          <ExperienceSelector selectedExp={experience} onSelectExp={setExperience} />
          <InterviewTypeSelector selectedType={interviewType} onSelectType={setInterviewType} />

          {/* Difficulty & Question Count Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <Gauge className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Difficulty</h3>
              </div>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      difficulty === d
                        ? 'border-[#FF6B00] bg-orange-50/80 text-[#FF6B00] ring-1 ring-orange-500/20'
                        : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Number of Questions</h3>
              </div>
              <div className="flex gap-2">
                {QUESTION_COUNTS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setNumQuestions(cnt)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      numQuestions === cnt
                        ? 'border-[#FF6B00] bg-orange-50/80 text-[#FF6B00] ring-1 ring-orange-500/20'
                        : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 sticky top-20">
          <SetupSummary
            role={role}
            experience={experience}
            interviewType={interviewType}
            difficulty={difficulty}
            numQuestions={numQuestions}
            onStart={handleStartInterview}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
