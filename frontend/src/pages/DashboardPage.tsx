import { useState, useMemo } from "react";
import api from "../api/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type LogEvent = {
  id: number;
  timestamp?: string;
  username?: string;
  source_ip?: string;
  domain?: string;
  url?: string;
  action?: string;
  status_code?: string;
  user_agent?: string;
  raw_line?: string;
};

type Anomaly = {
  id: number;
  event_id?: number;
  anomaly_type: string;
  severity: string;
  reason: string;
  confidence_score: number;
};

type Results = {
  file_id: number;
  filename: string;
  total_events: number;
  blocked_requests: number;
  unique_source_ips: number;
  total_anomalies: number;
  ai_summary: string;
  normal_observations: string;
  recommended_actions: string[];
  events: LogEvent[];
  anomalies: Anomaly[];
};

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage("Uploading and analyzing logs... (This may take a moment for AI insights)");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResponse = await api.post("/logs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileId = uploadResponse.data.file_id;
      
      const resultsResponse = await api.get(`/logs/${fileId}/results`);
      setResults(resultsResponse.data);
      setMessage("Analysis complete.");
    } catch (error) {
      setMessage("Upload or analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Maps anomalies for timeline O(1) lookup
  const anomaliesByEventId = useMemo(() => {
    if (!results) return {};
    const map: Record<number, Anomaly> = {};
    results.anomalies.forEach((a) => {
      if (a.event_id) {
        map[a.event_id] = a;
      }
    });
    return map;
  }, [results]);

  // Derive data for charts
  const chartData = useMemo(() => {
    if (!results) return [];
    const allowed = results.total_events - results.blocked_requests;
    return [
      { name: "Allowed Actions", count: allowed, color: "var(--accent-cyan)" },
      { name: "Blocked Actions", count: results.blocked_requests, color: "var(--accent-warning)" },
      { name: "Anomalies", count: results.total_anomalies, color: "var(--accent-red)" }
    ];
  }, [results]);

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
        <h1 className="text-glow text-cyan" style={{ fontSize: "2.5rem", margin: 0 }}>SOC Log Analyzer</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>Advanced Threat Detection & Analysis Dashboard</p>
      </header>

      <div className="glass-panel" style={{ padding: "20px", marginBottom: "40px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div className="file-upload-wrapper">
          <button className="btn-primary" style={{ pointerEvents: "none" }}>Select Log File</button>
          <input
            type="file"
            className="file-upload-input"
            accept=".log,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
        </div>
        <span style={{ color: "var(--text-secondary)" }}>{file ? file.name : "No file selected"}</span>
        
        <button 
          className="btn-primary" 
          onClick={handleUpload} 
          disabled={!file || loading}
          style={{ marginLeft: "auto", background: loading ? "var(--bg-color-hover)" : undefined }}
        >
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: "30px", color: loading ? "var(--accent-warning)" : "var(--accent-cyan)" }}>
          {message}
        </div>
      )}

      {results && (
        <>
          <div className="grid-stats">
            <div className="glass-panel" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", color: "var(--text-primary)", fontWeight: "bold" }}>{results.total_events}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase" }}>Total Events</div>
            </div>
            <div className="glass-panel" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", color: "var(--text-primary)", fontWeight: "bold" }}>{results.blocked_requests}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase" }}>Blocked Requests</div>
            </div>
            <div className="glass-panel" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", color: "var(--text-primary)", fontWeight: "bold" }}>{results.unique_source_ips}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase" }}>Unique IPs</div>
            </div>
            <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderColor: results.total_anomalies > 0 ? "var(--accent-red)" : undefined }}>
              <div style={{ fontSize: "2rem", color: results.total_anomalies > 0 ? "var(--accent-red)" : "var(--text-primary)", fontWeight: "bold" }}>
                {results.total_anomalies}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase" }}>Anomalies Detected</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              <div className="glass-panel" style={{ padding: "30px" }}>
                <h2 className="text-cyan" style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>AI Threat Summary</h2>
                <p style={{ lineHeight: "1.7", fontSize: "1.05rem", whiteSpace: "pre-line" }}>{results.ai_summary}</p>
              </div>
              <div className="glass-panel" style={{ padding: "30px" }}>
                <h2 style={{ color: "var(--text-secondary)", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Normal Observations</h2>
                <p style={{ lineHeight: "1.7", fontSize: "1.05rem", whiteSpace: "pre-line", color: "var(--text-secondary)" }}>{results.normal_observations}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              <div className="glass-panel" style={{ padding: "30px", flex: 1 }}>
                <h2 className="text-cyan" style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Traffic Overview (Chart)</h2>
                <div style={{ width: "100%", height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "var(--bg-color-card)", borderColor: "var(--border-color)", borderRadius: 8 }}
                        itemStyle={{ color: "var(--text-primary)" }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="glass-panel" style={{ padding: "30px" }}>
                <h2 className="text-cyan" style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Recommended Mitigation</h2>
                <ul style={{ paddingLeft: "20px", lineHeight: "1.7" }}>
                  {results.recommended_actions.map((action, index) => (
                    <li key={index} style={{ marginBottom: "10px" }}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-cyan" style={{ marginBottom: "10px" }}>Event Timeline</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>Chronological breakdown of network events. Anomalies are highlighted automatically.</p>
            
            <div className="timeline-container">
              {results.events.slice(0, 15).map((event) => {
                const anomaly = anomaliesByEventId[event.id];
                const isAnomalous = !!anomaly;
                
                // Standard Severity Mapping (Critical, Medium, Low, Normal)
                let tierClass = "normal-event";
                let badgeClass = "badge-normal";
                let badgeText = "Normal";
                let textColor = "var(--text-primary)";
                
                if (anomaly) {
                   if (anomaly.confidence_score >= 0.8) {
                      tierClass = "anomalous-event";
                      badgeClass = "badge-critical";
                      badgeText = "Critical";
                      textColor = "var(--text-primary)";
                   } else if (anomaly.confidence_score >= 0.5) {
                      tierClass = "anomalous-event";
                      badgeClass = "badge-medium";
                      badgeText = "Medium";
                      textColor = "var(--text-primary)";
                   } else {
                      tierClass = "anomalous-event";
                      badgeClass = "badge-low";
                      badgeText = "Low";
                      textColor = "var(--text-primary)";
                   }
                }

                return (
                  <div key={event.id} className={`timeline-event ${tierClass}`} style={{ borderColor: anomaly ? "var(--border-color)" : "transparent", background: anomaly ? "rgba(255,255,255,0.02)" : "transparent", boxShadow: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          {event.timestamp || "Unknown Time"}
                        </span>
                        <span className={`badge ${badgeClass}`}>{badgeText}</span>
                        {event.action === "Blocked" && (
                          <span className="badge badge-normal" style={{ color: "var(--text-secondary)" }}>Blocked</span>
                        )}
                      </div>
                      <span style={{ fontWeight: "bold", color: textColor }}>
                        {event.source_ip}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "15px" }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>User</div>
                        <div>{event.username || "-"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Domain</div>
                        <div>{event.domain || "-"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Status Code</div>
                        <div>{event.status_code || "-"}</div>
                      </div>
                    </div>

                    {event.url && (
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", marginBottom: "10px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", overflowX: "auto" }}>
                        <span style={{ color: "var(--text-secondary)" }}>URL:</span> {event.url}
                      </div>
                    )}

                    {isAnomalous && (
                      <div style={{ marginTop: "15px", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <strong style={{ color: "var(--text-primary)" }}>{anomaly.anomaly_type}</strong>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Confidence: {(anomaly.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>{anomaly.reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {results.events.length > 15 && (
                <div style={{ padding: "15px", textAlign: "center", color: "var(--text-secondary)" }}>
                  + {results.events.length - 15} more events. Consult the data table below for full raw view.
                </div>
              )}
            </div>
          </div>

          {/* Raw Log Results Table View */}
          <div style={{ marginTop: "60px" }}>
            <h2 className="text-cyan" style={{ marginBottom: "10px" }}>Raw Data Table</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>Comprehensive tabular view of log structure.</p>
            
            <div className="glass-panel" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(0,0,0,0.2)" }}>
                    <th style={{ padding: "15px", textAlign: "left", color: "var(--text-secondary)" }}>Timestamp</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "var(--text-secondary)" }}>Source IP</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "var(--text-secondary)" }}>User</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "var(--text-secondary)" }}>Action</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "var(--text-secondary)" }}>Domain</th>
                    <th style={{ padding: "15px", textAlign: "left", color: "var(--text-secondary)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.events.map((event) => {
                    const isAnomalous = !!anomaliesByEventId[event.id];
                    return (
                      <tr key={event.id} style={{ borderBottom: "1px solid var(--border-color)"}}>
                        <td style={{ padding: "12px 15px", fontFamily: "var(--font-mono)" }}>{event.timestamp || "-"}</td>
                        <td style={{ padding: "12px 15px", color: isAnomalous ? "var(--text-primary)" : "var(--text-secondary)" }}>{event.source_ip || "-"}</td>
                        <td style={{ padding: "12px 15px" }}>{event.username || "-"}</td>
                        <td style={{ padding: "12px 15px" }}>
                          {event.action === "Blocked" ? (
                            <span style={{ color: "var(--accent-warning)", fontWeight: "bold" }}>Blocked</span>
                          ) : (
                            event.action || "-"
                          )}
                        </td>
                        <td style={{ padding: "12px 15px" }}>{event.domain || "-"}</td>
                        <td style={{ padding: "12px 15px" }}>{event.status_code || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}