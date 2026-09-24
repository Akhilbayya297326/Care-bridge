import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, PhoneCall, Image as ImageIcon, UserPlus, Camera, Check, History, X, Server, ServerCrash, BrainCircuit } from 'lucide-react';

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('connecting');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Use the environment variable, fallback to localhost for local testing
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/patients`);
      if (!response.ok) throw new Error("Server returned error status");
      
      const data = await response.json();
      
      const uniquePatientsMap = new Map();
      data.forEach(record => {
        if (!uniquePatientsMap.has(record.phone_number)) {
          uniquePatientsMap.set(record.phone_number, record);
        }
      });
      
      setPatients(Array.from(uniquePatientsMap.values()));
      setServerStatus('connected');
      setLoading(false);
    } catch (error) {
      console.error("Backend Connection Failed:", error);
      setServerStatus('disconnected');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await fetch(`${API_BASE}/api/patients/${id}`, { method: 'PATCH' });
      fetchPatients();
    } catch (error) {
      console.error("Error resolving patient:", error);
    }
  };

  const viewHistory = async (phoneNumber) => {
    try {
      const encodedPhone = phoneNumber.replace('+', '%2B');
      // BUG FIXED HERE: Replaced localhost with API_BASE
      const response = await fetch(`${API_BASE}/api/patients/${encodedPhone}/history`);
      const data = await response.json();
      setHistoryData(data);
      setSelectedPatient(phoneNumber);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const stats = {
    critical: patients.filter(p => p.triage_color === 'Red').length,
    watch: patients.filter(p => p.triage_color === 'Yellow').length,
    stable: patients.filter(p => p.triage_color === 'Green').length,
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans relative">
      <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <ActivityIcon className="text-blue-600 w-8 h-8" />
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CareBridge Triage</h1>
            </div>
            <p className="text-slate-500 mt-1 font-medium">District Hospital Central Hub</p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${serverStatus === 'connected' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {serverStatus === 'connected' ? <Server className="w-4 h-4" /> : <ServerCrash className="w-4 h-4" />}
              <span className="font-semibold text-sm tracking-wide uppercase">
                {serverStatus === 'connected' ? 'DB Connected' : 'DB Disconnected'}
              </span>
            </div>

            <div className="text-right border-l border-slate-200 pl-8">
              <p className="font-bold text-lg text-slate-800">Dr. Sharma</p>
              <p className="text-slate-500 font-medium text-sm">Surgery Dept. (DS)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="bg-slate-800 text-white rounded-lg p-4 mb-8 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2 font-semibold">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Live Pipeline Active
          </div>
          <div className="flex gap-6 font-medium">
            <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {stats.critical} Critical</span>
            <span className="text-yellow-400 flex items-center gap-1"><Clock className="w-4 h-4"/> {stats.watch} Watch</span>
            <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> {stats.stable} Stable</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
        ) : serverStatus === 'disconnected' ? (
          <div className="text-center p-12 bg-red-50 rounded-xl border border-red-200">
            <ServerCrash className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800 mb-2">Backend Connection Lost</h3>
            <p className="text-red-600">Check your Vercel Environment Variables to ensure VITE_API_URL is correct.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {patients.map((patient) => (
              <PatientCard key={patient._id || patient.id} patient={patient} onResolve={handleResolve} onViewHistory={viewHistory}/>
            ))}
            {patients.length === 0 && (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium text-lg">Database is empty. Awaiting WhatsApp messages.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">Timeline: {selectedPatient}</h2>
              <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="relative border-l-2 border-slate-300 ml-3 space-y-8">
                {historyData.map((record) => (
                  <div key={record._id || record.id} className="relative pl-6">
                    <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${record.triage_color === 'Red' ? 'bg-red-500' : record.triage_color === 'Yellow' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                      <div className="flex justify-between text-sm mb-2 font-semibold text-slate-500">
                        <span>{new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className={`uppercase ${record.triage_color === 'Red' ? 'text-red-700' : record.triage_color === 'Yellow' ? 'text-amber-700' : 'text-green-700'}`}>{record.triage_color}</span>
                      </div>
                      {record.symptoms_text && <p className="text-slate-700 italic">"{record.symptoms_text}"</p>}
                      {record.media_url && (
                        <a href={record.media_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                          <ImageIcon className="w-4 h-4"/> View Uploaded Image
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient, onResolve, onViewHistory }) {
  const isRed = patient.triage_color === 'Red';
  const isYellow = patient.triage_color === 'Yellow';
  
  const cardColor = isRed ? 'bg-red-50 border-red-200' : isYellow ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200';
  const badgeColor = isRed ? 'bg-red-100 text-red-800 border-red-300' : isYellow ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-green-100 text-green-800 border-green-300';
  const Icon = isRed ? AlertTriangle : isYellow ? Clock : CheckCircle;

  return (
    <div className={`rounded-xl border-2 shadow-sm p-6 flex flex-col gap-4 transition-all hover:shadow-md ${cardColor}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-2xl font-bold font-mono text-slate-800 tracking-tight">{patient.phone_number}</h2>
          <p className="text-slate-600 mt-2 flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4" /> 
            Latest update: {new Date(patient.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(patient.timestamp).toLocaleDateString()}
          </p>
          
          {/* AI Insights Panel */}
          {(patient.ai_detected_symptoms || patient.symptoms_text) && (
            <div className="mt-4 bg-white p-4 rounded-lg border shadow-sm flex flex-col gap-2">
              {patient.symptoms_text && (
                <p className="text-slate-700 italic border-l-2 border-slate-300 pl-3">
                  "{patient.symptoms_text}"
                </p>
              )}
              {patient.ai_detected_symptoms && patient.ai_detected_symptoms !== "Unknown" && (
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
                    <BrainCircuit className="w-4 h-4" /> AI Clinical Assessment
                  </div>
                  <p className="text-sm text-slate-800"><strong>Symptoms:</strong> {patient.ai_detected_symptoms}</p>
                  <p className="text-sm text-slate-800"><strong>Recommendation:</strong> {patient.ai_recommendation}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`ml-4 px-4 py-2 rounded-full border-2 font-bold uppercase flex items-center gap-2 ${badgeColor}`}>
          <Icon className="w-5 h-5" />
          {patient.triage_color}
        </div>
      </div>

      <div className="flex gap-3 mt-2 pt-4 border-t border-black/10 justify-between items-center flex-wrap">
        <div className="flex gap-3 flex-wrap">
          {isRed && (
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
              <PhoneCall className="w-4 h-4" /> Tele-Consult
            </button>
          )}
          {isYellow && (
            <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" /> Alert ASHA
            </button>
          )}
          <button onClick={() => onViewHistory(patient.phone_number)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <History className="w-4 h-4" /> View History
          </button>
          {patient.media_url && (
            <a href={patient.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer">
              <ImageIcon className="w-4 h-4" /> View Image
            </a>
          )}
        </div>

        {(isRed || isYellow) && (
          <button onClick={() => onResolve(patient._id || patient.id)} className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Check className="w-4 h-4" /> Mark Resolved
          </button>
        )}
      </div>
    </div>
  );
}

function ActivityIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
  )
}

export default App;
