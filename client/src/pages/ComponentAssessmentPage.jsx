import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowLeft, HiOutlineCog } from 'react-icons/hi';

export default function ComponentAssessmentPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [components, setComponents] = useState([]);
  const [currentComp, setCurrentComp] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [allQuestions, setAllQuestions] = useState({});
  const [allAnswers, setAllAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      const deviceRes = await api.get(`/devices/${deviceId}`);
      setDevice(deviceRes.data);

      const compRes = await api.get(`/categories/${deviceRes.data.category_id}/components`);
      setComponents(compRes.data);

      const questionsMap = {};
      for (const comp of compRes.data) {
        const qRes = await api.get(`/components/${comp.id}/questions`);
        questionsMap[comp.id] = qRes.data;
      }
      setAllQuestions(questionsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentComponent = components[currentComp];
  const questions = currentComponent ? allQuestions[currentComponent.id] || [] : [];
  const question = questions[currentQ];

  const handleAnswer = (answer) => {
    const compId = currentComponent.id;
    const qId = question.id;
    const updated = {
      ...allAnswers,
      [compId]: { ...(allAnswers[compId] || {}), [qId]: answer },
    };
    setAllAnswers(updated);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      moveToNextComponent(updated);
    }
  };

  const moveToNextComponent = (updatedAnswers) => {
    if (currentComp < components.length - 1) {
      setCurrentComp(currentComp + 1);
      setCurrentQ(0);
    } else {
      submitAll(updatedAnswers);
    }
  };

  const submitAll = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const componentResponses = components.map((comp) => ({
        component_id: comp.id,
        responses: Object.entries(finalAnswers[comp.id] || {}).map(([qid, ans]) => ({
          question_id: parseInt(qid),
          answer: ans,
        })),
      }));

      await api.post(`/components/${deviceId}/assess`, { componentResponses });
      navigate(`/devices/${deviceId}/components/results`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-text-primary text-base font-medium">Evaluating salvage components…</p>
        <p className="text-text-secondary text-xs">Computing reusable parts viability & recycling recovery actions</p>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="page-container max-w-2xl text-center py-16">
        <p className="text-text-secondary text-sm">No component assessments defined for this category.</p>
      </div>
    );
  }

  const totalQuestions = components.reduce((acc, c) => acc + (allQuestions[c.id]?.length || 0), 0);
  const answeredQuestions = Object.values(allAnswers).reduce(
    (acc, compAnswers) => acc + Object.keys(compAnswers).length,
    0,
  );
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="page-header animate-fade-up">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full inline-block mb-2">
          Modular Salvage Assessment
        </div>
        <h1 className="page-title text-text-primary">Component Integrity Diagnostics</h1>
        <p className="page-subtitle">{device?.brand} {device?.model}</p>
      </div>

      {/* Component navigation stepper */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 animate-fade-up">
        {components.map((comp, i) => {
          const isActive = i === currentComp;
          const isDone = i < currentComp;
          return (
            <div
              key={comp.id}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-primary-700 text-white border-primary-700 font-semibold'
                  : isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-text-secondary border-border'
              }`}
            >
              {isDone && <span className="mr-1 text-emerald-600 font-bold">✓</span>}
              {comp.name}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-6 animate-fade-up">
        <div className="flex justify-between text-xs text-text-secondary mb-2 font-medium">
          <span>{currentComponent?.name} • Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-700 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <div className="glass-card p-6 sm:p-8 bg-white border border-border shadow-xs animate-fade-up">
          <div className="text-xs font-semibold text-primary-700 mb-2 flex items-center gap-1.5">
            <HiOutlineCog className="w-4 h-4" /> {currentComponent?.name} Diagnostic
          </div>

          {question.is_disqualifier && (
            <div className="mb-4 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold inline-flex items-center gap-1">
              Critical Check
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-medium text-text-primary mb-8 leading-relaxed">
            {question.text}
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => handleAnswer('yes')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-base transition-colors cursor-pointer"
            >
              <HiOutlineCheckCircle className="w-6 h-6 text-emerald-600" />
              Yes
            </button>
            <button
              onClick={() => handleAnswer('no')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-base transition-colors cursor-pointer"
            >
              <HiOutlineXCircle className="w-6 h-6 text-rose-600" />
              No
            </button>
          </div>

          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              className="mt-6 text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HiOutlineArrowLeft className="w-3.5 h-3.5" />
              Previous question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
