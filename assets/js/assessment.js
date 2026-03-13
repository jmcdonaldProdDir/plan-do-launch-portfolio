// PDL Assessment Storage

const STORAGE_KEY = "pdl_assessment_answers";
const REPORT_KEY = "pdl_assessment_report";

function loadAnswers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function saveAnswers(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Restore answers when page loads
document.addEventListener("DOMContentLoaded", function () {

    const answers = loadAnswers();

    document.querySelectorAll(".assessment-answer").forEach(input => {

        const name = input.name;

        // Restore checked state
        if (answers[name] && answers[name] === input.value) {
            input.checked = true;
        }

        // Save when changed
        input.addEventListener("change", function () {

            const updated = loadAnswers();
            updated[name] = this.value;

            saveAnswers(updated);

        });

    });

});

// ------------------------------
// Submit Assessment on Complete Page
// ------------------------------

async function submitAssessment() {

    const reportContainer = document.getElementById("report");

    if (!reportContainer) return;

    const cachedReport = localStorage.getItem(REPORT_KEY);

    if (cachedReport) {
        const result = JSON.parse(cachedReport);
        renderReport(result);
        return;
    }

    const data = loadAnswers();

   if (!data || !data.organization) {
        reportContainer.innerHTML = "<h3>No assessment data found.</h3>";
        return;
    }

    const answers = {
        staff: [],
        canon: [],
        execution: [],
        reporting: [],
        integration: []
    };

    const scoreMap = {
        struggling: -1,
        functional: 0,
        scalable: 1
    };

    for (let i = 1; i <= 10; i++) {

        answers.staff.push(scoreMap[data[`S1_Q${i}`]] ?? 0);
        answers.canon.push(scoreMap[data[`S2_Q${i}`]] ?? 0);
        answers.execution.push(scoreMap[data[`S3_Q${i}`]] ?? 0);
        answers.reporting.push(scoreMap[data[`S4_Q${i}`]] ?? 0);
        answers.integration.push(scoreMap[data[`S5_Q${i}`]] ?? 0);

    }

const payload = {
    organization: data.organization,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    answers
};

    try {

    const response = await fetch("/api/complete-assessment", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
});

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        localStorage.setItem(REPORT_KEY, JSON.stringify(result));

        console.log("Diagnostic result:", result);
        console.log("Staff pillar object:", result.report.pillars.staff);

        if (!result.report || !result.pillarScores) {
            throw new Error("Invalid report structure");
        }

        renderReport(result);

    } catch (err) {

        console.error(err);

        reportContainer.innerHTML =
            "<h3>Unable to generate report.</h3>";

    }

}

function pillarTier(score) {

    if (score <= -5) return "Struggling";
    if (score >= 5) return "Scalable";
    return "Functional";

}

function renderReport(result) {

    const reportContainer = document.getElementById("report");

    // --- Derived structural snapshot metrics ---
    const controlNames = {
      staff: "Staff Acceleration",
      canon: "Canon Governance",
      execution: "Process Definition",
      reporting: "Signal Visibility",
      integration: "Continual Improvement"
    };

    const scores = result.pillarScores;
    const entries = Object.entries(scores);
    const strongest = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    const weakest = entries.reduce((a, b) => (a[1] < b[1] ? a : b));

    const strongestControl = `${controlNames[strongest[0]]} (${strongest[1]})`;
    const weakestControl = `${controlNames[weakest[0]]} (${weakest[1]})`;

    const values = entries.map(e => e[1]);
    const structuralAsymmetry = Math.max(...values) - Math.min(...values);
    const diagnosticConfidence = structuralAsymmetry <= 10 ? 75 : 60;
    const ici = result.iciScore;
    const iciBand =
      ici <= 29 ? "fragile" :
      ici <= 44 ? "below" :
      ici <= 55 ? "baseline" :
      ici <= 69 ? "emerging" :
      ici <= 85 ? "stable" :
      "compounding";

    reportContainer.innerHTML = `

<div class="text-start">

<div class="mb-4">
<div class="d-flex justify-content-between align-items-start gap-4 flex-wrap">

<div class="flex-grow-1">
<p class="text-uppercase small mb-2" style="letter-spacing: 0.2em;">Onboarding Capacity Diagnostic</p>
<h2 class="mb-3">Onboarding Infrastructure Capacity Report</h2>
<p class="lead mb-0">A structural evaluation of onboarding infrastructure across five operational controls.</p>
</div>

<div class="border rounded-4 px-4 py-3 text-center" style="min-width: 120px;">
<p class="text-uppercase small mb-2" style="letter-spacing: 0.2em;">ICI</p>
<div style="font-size: 3rem; font-weight: 700; line-height: 1;">${result.iciScore}</div>
<p class="mb-0 mt-2">/ 100</p>
</div>

</div>

</div>

<div class="card mb-4 shadow-sm">
<div class="card-body">

<h4 class="mb-3">Control Score Distribution</h4>

<canvas id="controlScoreChart" height="120"></canvas>

 
</div>
</div>

<!--
<div class="card mb-4 shadow-sm">
<div class="card-body">

<h4 class="mb-3">Structural Summary</h4>

<p class="lead">${result.interpretation}</p>

<p><strong>Infrastructure Control Integrity (ICI):</strong> ${result.iciScore}</p>
<p><strong>Raw Structural Score:</strong> ${result.rawScore}</p>

</div>
</div>
-->

<div class="mb-4">
<h3 class="mb-3">Executive Summary</h3>

<p>${result.report.executiveSummary}</p>

</div>

${Object.entries(result.report.pillars)
  .filter(([key]) => ["staff","canon","execution","reporting","integration"].includes(key))
  .map(([key, control]) => `
<div class="card mb-4 shadow-sm control-${control.tier}">
<div class="card-body">

<h3>
  ${control.title.replace(` — ${control.tier.charAt(0).toUpperCase() + control.tier.slice(1)}`, "")}
  <span class="tier-badge badge-${control.tier}">
    ${control.tier.toUpperCase()}
  </span>
</h3>

<p>${control.overview}</p>

<h5 class="mt-3">Operational Consequence</h5>
<p>${control.consequence}</p>

<h5 class="mt-3">Structural Risk</h5>
<p>${control.risk}</p>

</div>
</div>
`).join("")}

<div class="card mb-4 shadow-sm">
<div class="card-body">

<h4 class="mb-3">Structural Pattern Snapshot</h4>

<div class="row">

<div class="col-md-6">
<p>• ICI Score: ${result.iciScore}</p>
<p>• Model Version: PDL-ICI-1.0.0</p>
<p>• Weakest Control: ${weakestControl}</p>
<p>• Hero Dependence Signal: ${result.heroDependence || "None"}</p>
</div>

<div class="col-md-6">
<p>• Diagnostic Confidence: ${diagnosticConfidence}${diagnosticConfidence ? " (High Confidence)" : ""}</p>
<p>• Strongest Control: ${strongestControl}</p>
<p>• Structural Asymmetry: ${structuralAsymmetry}</p>
</div>

</div>

</div>
</div>

<div class="card mb-4 shadow-sm">
<div class="card-body">

<h4 class="mb-3">Diagnostic Terms</h4>

<p><strong>Hero Dependence</strong> — A structural condition where operational outcomes rely on individual expertise rather than governed systems or documented processes.</p>

<p><strong>Structural Asymmetry</strong> — A condition where operational controls are unevenly developed, allowing strong delivery capabilities to operate without equally strong governance or visibility.</p>

<p><strong>Infrastructure Control Integrity (ICI)</strong> — A normalized score representing the structural health and balance of onboarding operational controls.</p>

<p><strong>Diagnostic Confidence</strong> — An index indicating the structural stability of the diagnostic result.</p>

</div>
</div>

<div class="card mb-4 shadow-sm">
<div class="card-body">

<h4 class="mb-3">About This Diagnostic</h4>

<p>This assessment evaluates the structural controls governing onboarding delivery.</p>

<p>It measures system design, governance, and operational reliability.</p>

<p>It does not evaluate individual employee performance, customer sentiment, or product quality.</p>

<p>The Infrastructure Control Integrity (ICI) score reflects the durability and scalability of onboarding infrastructure rather than current customer satisfaction.</p>

<p>Onboarding outcomes are shaped by infrastructure. This diagnostic measures that infrastructure.</p>

</div>
</div>

<div class="card mb-4 shadow-sm">
<div class="card-body">

<h4 class="mb-3">Infrastructure Capacity Index (ICI) Scale</h4>

<p
  class="${iciBand==='fragile' ? 'p-2 rounded' : ''}"
  style="${iciBand==='fragile' ? 'background:#cbd5f5;border-left:6px solid #3B5B7A;' : ''}"
>0–29 — Structurally Fragile</p>
<p
  class="${iciBand==='below' ? 'p-2 rounded' : ''}"
  style="${iciBand==='below' ? 'background:#cbd5f5;border-left:6px solid #3B5B7A;' : ''}"
>30–44 — Below Functional Baseline</p>
<p
  class="${iciBand==='baseline' ? 'p-2 rounded' : ''}"
  style="${iciBand==='baseline' ? 'background:#cbd5f5;border-left:6px solid #3B5B7A;' : ''}"
>45–55 — Functional Baseline</p>
<p
  class="${iciBand==='emerging' ? 'p-2 rounded' : ''}"
  style="${iciBand==='emerging' ? 'background:#cbd5f5;border-left:6px solid #3B5B7A;' : ''}"
>56–69 — Emerging Stability</p>
<p
  class="${iciBand==='stable' ? 'p-2 rounded' : ''}"
  style="${iciBand==='stable' ? 'background:#cbd5f5;border-left:6px solid #3B5B7A;' : ''}"
>70–85 — Structurally Stable</p>
<p
  class="${iciBand==='compounding' ? 'p-2 rounded' : ''}"
  style="${iciBand==='compounding' ? 'background:#cbd5f5;border-left:6px solid #3B5B7A;' : ''}"
>86–100 — Compounding Infrastructure</p>

</div>
</div>

</div>

`;

  const ctx = document.getElementById("controlScoreChart");

    if (ctx) {

      const scores = result.pillarScores;

      const valueLabelPlugin = {
        id: "valueLabels",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const zeroY = chart.scales.y.getPixelForValue(0);
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
              const value = dataset.data[index];
              const isInBar = value < 0;
              ctx.save();
              ctx.fillStyle = isInBar ? "#fff" : "#1f2937";
              ctx.font = "600 12px Inter, system-ui, sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              ctx.fillText(value, bar.x, bar.y - 6);
              ctx.restore();
            });
          });
        }
      };

      new Chart(ctx, {
        plugins: [valueLabelPlugin],
        type: "bar",
        data: {
        labels: [
          "Staff Acceleration",
          "Canon Governance",
          "Process Definition",
          "Signal Visibility",
          "Continual Improvement"
        ],
        datasets: [{
          data: [
            scores.staff,
            scores.canon,
            scores.execution,
            scores.reporting,
            scores.integration
          ],
          backgroundColor: [
            scores.staff < 0 ? "#8B3A3A" : "#3F5E7A",
            scores.canon < 0 ? "#8B3A3A" : "#3F5E7A",
            scores.execution < 0 ? "#8B3A3A" : "#3F5E7A",
            scores.reporting < 0 ? "#8B3A3A" : "#3F5E7A",
            scores.integration < 0 ? "#8B3A3A" : "#3F5E7A"
          ],
          borderRadius: 6,
          barThickness: 40
        }]
        },
        options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: -10,
            max: 10,
            ticks: {
              stepSize: 5
            },
          grid: {
            color: (context) =>
              context.tick.value === 0 ? "#6c757d" : "#e5e7eb",
            lineWidth: (context) => (context.tick.value === 0 ? 3 : 1)
          }
          },
          x: {
            grid: { display: false }
          }
          }
        }
      });

    }

}

// Run when page loads
document.addEventListener("DOMContentLoaded", submitAssessment);
