import { useState, useEffect } from 'react'
import './MedicalQuestionnaire.css'

const MEDICAL_QUESTIONS = [
  { id: 'asthma', text: 'Do you have or have you ever had asthma or wheezing?', critical: true },
  { id: 'diabetes', text: 'Do you have diabetes (Type 1 or Type 2)?', critical: true },
  { id: 'seizures', text: 'Have you ever had seizures, blackouts, or epilepsy?', critical: true },
  { id: 'heart', text: 'Do you have any heart conditions, high blood pressure, or pacemaker?', critical: true },
  { id: 'lung', text: 'Have you had a collapsed lung (pneumothorax) or lung surgery?', critical: true },
  { id: 'ear', text: 'Do you have chronic ear or sinus problems?', critical: false },
  { id: 'pregnancy', text: 'Are you pregnant or suspect you might be?', critical: true },
  { id: 'medications', text: 'Are you taking any prescription medications?', critical: false },
  { id: 'divingHistory', text: 'Have you ever had decompression sickness (the bends)?', critical: true },
  { id: 'surgery', text: 'Have you had major surgery in the past year?', critical: false },
  { id: 'anxiety', text: 'Do you experience claustrophobia or panic attacks?', critical: false },
  { id: 'alcohol', text: 'Do you consume alcohol regularly before diving activities?', critical: true }
]

export default function MedicalQuestionnaire({ onComplete, onClose }) {
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem('medical_questionnaire')
    return saved ? JSON.parse(saved) : {}
  })
  const [showWarning, setShowWarning] = useState(false)

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = () => {
    const hasCriticalYes = MEDICAL_QUESTIONS.some(
      q => q.critical && answers[q.id] === 'yes'
    )
    
    if (hasCriticalYes) {
      setShowWarning(true)
      return
    }
    
    localStorage.setItem('medical_questionnaire', JSON.stringify(answers))
    localStorage.setItem('medical_clearance_date', new Date().toISOString())
    onComplete?.()
    onClose?.()
  }

  const hasAnswered = Object.keys(answers).length > 0
  const needsPhysicianApproval = MEDICAL_QUESTIONS.some(
    q => q.critical && answers[q.id] === 'yes'
  )

  return (
    <div className="medical-modal-overlay" onClick={onClose}>
      <div className="medical-modal" onClick={e => e.stopPropagation()}>
        <div className="medical-header">
          <h3>🏥 Diver Medical Questionnaire</h3>
          <button className="medical-close" onClick={onClose}>×</button>
        </div>
        <p className="medical-disclaimer">
          Based on <strong>DAN (Divers Alert Network)</strong> guidelines. This helps identify conditions that may affect your safety while diving.
        </p>
        
        <div className="medical-questions">
          {MEDICAL_QUESTIONS.map(q => (
            <div key={q.id} className={`medical-question ${answers[q.id] === 'yes' ? 'has-yes' : ''}`}>
              <div className="question-text">
                {q.text}
                {q.critical && <span className="critical-badge">Critical</span>}
              </div>
              <div className="medical-options">
                <label className={answers[q.id] === 'yes' ? 'selected-yes' : ''}>
                  <input
                    type="radio"
                    name={q.id}
                    value="yes"
                    checked={answers[q.id] === 'yes'}
                    onChange={() => handleAnswer(q.id, 'yes')}
                  /> Yes
                </label>
                <label className={answers[q.id] === 'no' ? 'selected-no' : ''}>
                  <input
                    type="radio"
                    name={q.id}
                    value="no"
                    checked={answers[q.id] === 'no'}
                    onChange={() => handleAnswer(q.id, 'no')}
                  /> No
                </label>
              </div>
            </div>
          ))}
        </div>

        {showWarning && (
          <div className="medical-warning">
            ⚠️ <strong>IMPORTANT:</strong> Based on your responses, you should consult a physician before diving.
            The Divers Alert Network (DAN) strongly recommends medical evaluation.
          </div>
        )}

        {needsPhysicianApproval && !showWarning && hasAnswered && (
          <div className="medical-note">
            ℹ️ Some of your responses indicate you should consult a physician before diving.
          </div>
        )}

        <div className="medical-actions">
          <button onClick={onClose} className="medical-cancel-btn">Close</button>
          <button onClick={handleSubmit} className="medical-submit-btn">
            {hasAnswered ? 'Update & Save' : 'Save Responses'}
          </button>
        </div>
      </div>
    </div>
  )
}