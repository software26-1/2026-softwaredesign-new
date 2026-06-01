import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { SCHOOLS } from '../data/schools';

type Role = 'TEACHER' | 'STUDENT' | 'PARENT' | '';

interface FormState {
  name: string;
  phone: string;
  residentNumber: string;
  role: Role;
  schoolName: string;
  grade: string;
  classNum: string;
  studentNum: string;
  position: string;
  homeroomGrade: string;
  homeroomClassNum: string;
}

const GRADES = [1, 2, 3];

function SchoolSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const results = query.length >= 1
    ? SCHOOLS.filter(s => s.includes(query)).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={inputStyle}
        type="text"
        placeholder="학교명 검색 (예: 시흥)"
        value={query}
        required
        onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); }}
        onFocus={() => query.length >= 1 && setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
          maxHeight: '240px', overflowY: 'auto',
        }}>
          {results.map(school => (
            <div
              key={school}
              onMouseDown={() => { onChange(school); setQuery(school); setOpen(false); }}
              style={{
                padding: '10px 14px', fontSize: '14px', cursor: 'pointer',
                color: '#1a1a2e', borderBottom: '1px solid #f3f4f6',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              {school}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  background: '#fafafa', color: '#111827',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#6b7280', marginBottom: '6px', letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: '', phone: '', residentNumber: '', role: '', schoolName: '',
    grade: '', classNum: '', studentNum: '',
    position: '', homeroomGrade: '', homeroomClassNum: '',
  });
  const [ssnFront, setSsnFront] = useState('');
  const [ssnBack, setSsnBack] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleRoleSelect = (role: Role) =>
    setForm(prev => ({
      ...prev, role,
      grade: '', classNum: '', studentNum: '',
      position: '', homeroomGrade: '', homeroomClassNum: '',
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name, phone: form.phone, role: form.role, schoolName: form.schoolName,
        residentNumber: ssnFront && ssnBack ? `${ssnFront}-${ssnBack}` : undefined,
      };
      if (form.role === 'STUDENT' || form.role === 'PARENT') {
        payload.grade = Number(form.grade);
        payload.classNum = Number(form.classNum);
        payload.studentNum = Number(form.studentNum);
      } else if (form.role === 'TEACHER') {
        payload.position = form.position;
        if (form.position === 'HOMEROOM') {
          payload.homeroomGrade = Number(form.homeroomGrade);
          payload.homeroomClassNum = Number(form.homeroomClassNum);
        }
      }
      await client.post('/auth/profile', payload);
      navigate('/waiting-approval');
    } catch {
      setError('정보 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: Role; label: string }[] = [
    { value: 'TEACHER', label: '선생님' },
    { value: 'STUDENT', label: '학생' },
    { value: 'PARENT', label: '학부모' },
  ];

  const canSubmit = !isLoading && form.role && form.name && form.schoolName;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f1f5f9', padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.08)',
        width: '100%', maxWidth: '520px',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 36px 24px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e3a5f, #2563a8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '14px',
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
            추가 정보 입력
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            가입 신청을 위해 정보를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px 36px 32px' }}>
          {/* 역할 토글 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>구분</label>
            <div style={{
              display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px',
            }}>
              {roles.map(r => (
                <button
                  key={r.value} type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  style={{
                    flex: 1, padding: '9px 0', border: 'none', borderRadius: '7px',
                    fontSize: '14px', fontWeight: form.role === r.value ? 600 : 400,
                    background: form.role === r.value ? '#fff' : 'transparent',
                    color: form.role === r.value ? '#1e3a5f' : '#9ca3af',
                    cursor: 'pointer',
                    boxShadow: form.role === r.value ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 이름 / 전화번호 */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>이름</label>
              <input style={inputStyle} type="text" required placeholder="홍길동" value={form.name} onChange={set('name')} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>전화번호</label>
              <input style={inputStyle} type="tel" placeholder="010-0000-0000" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          {/* 주민등록번호 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>주민등록번호</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                type="text" placeholder="000000" maxLength={6}
                value={ssnFront}
                onChange={e => setSsnFront(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
              <input
                style={{ ...inputStyle, flex: 1, minWidth: 0, letterSpacing: '2px' }}
                type="password" placeholder="●●●●●●●" maxLength={7}
                value={ssnBack}
                onChange={e => setSsnBack(e.target.value.replace(/\D/g, '').slice(0, 7))}
              />
            </div>
          </div>

          {/* 학교 검색 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>학교</label>
            <SchoolSearch value={form.schoolName} onChange={v => setForm(prev => ({ ...prev, schoolName: v }))} />
          </div>

          {/* 학생 */}
          {form.role === 'STUDENT' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>학년 / 반 / 번호</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select style={{ ...inputStyle, flex: 1 }} required value={form.grade} onChange={set('grade')}>
                  <option value="">학년</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}학년</option>)}
                </select>
                <input style={{ ...inputStyle, flex: 1 }} type="number" min={1} max={99} placeholder="반" required
                  value={form.classNum} onChange={set('classNum')} />
                <input style={{ ...inputStyle, flex: 1 }} type="number" min={1} max={99} placeholder="번호" required
                  value={form.studentNum} onChange={set('studentNum')} />
              </div>
            </div>
          )}

          {/* 학부모 */}
          {form.role === 'PARENT' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>자녀 학년 / 반 / 번호</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select style={{ ...inputStyle, flex: 1 }} required value={form.grade} onChange={set('grade')}>
                  <option value="">학년</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}학년</option>)}
                </select>
                <input style={{ ...inputStyle, flex: 1 }} type="number" min={1} max={99} placeholder="반" required
                  value={form.classNum} onChange={set('classNum')} />
                <input style={{ ...inputStyle, flex: 1 }} type="number" min={1} max={99} placeholder="번호" required
                  value={form.studentNum} onChange={set('studentNum')} />
              </div>
            </div>
          )}

          {/* 선생님 */}
          {form.role === 'TEACHER' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>직책</label>
              <div style={{
                display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px',
                marginBottom: form.position === 'HOMEROOM' ? '14px' : '0',
              }}>
                {[{ value: 'HOMEROOM', label: '담임' }, { value: 'SUBJECT', label: '교과담당' }, { value: 'NON_SUBJECT', label: '비교과' }].map(p => (
                  <button
                    key={p.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, position: p.value, homeroomGrade: '', homeroomClassNum: '' }))}
                    style={{
                      flex: 1, padding: '9px 0', border: 'none', borderRadius: '7px',
                      fontSize: '14px', fontWeight: form.position === p.value ? 600 : 400,
                      background: form.position === p.value ? '#fff' : 'transparent',
                      color: form.position === p.value ? '#1e3a5f' : '#9ca3af',
                      cursor: 'pointer',
                      boxShadow: form.position === p.value ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {form.position === 'HOMEROOM' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>담당 학년</label>
                    <select style={inputStyle} required value={form.homeroomGrade} onChange={set('homeroomGrade')}>
                      <option value="">-</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}학년</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>담당 반</label>
                    <input style={inputStyle} type="number" min={1} max={99} placeholder="반 입력" required
                      value={form.homeroomClassNum} onChange={set('homeroomClassNum')} />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2', color: '#dc2626',
              borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
              borderLeft: '3px solid #dc2626',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '13px',
              background: canSubmit ? 'linear-gradient(135deg, #1e3a5f, #2563a8)' : '#e5e7eb',
              color: canSubmit ? '#fff' : '#9ca3af',
              border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              marginTop: '4px',
            }}
          >
            {isLoading ? '저장 중...' : '가입 신청'}
          </button>
        </form>
      </div>
    </div>
  );
}
