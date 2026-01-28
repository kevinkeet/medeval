/**
 * Main Application Logic
 */

// Global state
let patientData = {};
let calculatedRisks = {};
let currentSection = 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeGoalsOfCare();
    initializeDiabetesFields();
});

/**
 * Set up event listeners
 */
function initializeEventListeners() {
    // Diabetes status changes
    const diabetesSelect = document.getElementById('diabetes-status');
    if (diabetesSelect) {
        diabetesSelect.addEventListener('change', function() {
            const diabetesFields = document.querySelectorAll('.diabetes-fields');
            const showFields = this.value === 'type2' || this.value === 'type1';
            diabetesFields.forEach(field => {
                field.style.display = showFields ? 'flex' : 'none';
            });
        });
    }
}

/**
 * Initialize Goals of Care selection
 */
function initializeGoalsOfCare() {
    const gocOptions = document.querySelectorAll('.goc-option');
    gocOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected from all
            gocOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected to clicked
            this.classList.add('selected');
            // Store value
            document.getElementById('goc-value').value = this.dataset.value;
        });
    });
}

/**
 * Initialize diabetes-specific fields visibility
 */
function initializeDiabetesFields() {
    const diabetesSelect = document.getElementById('diabetes-status');
    if (diabetesSelect) {
        diabetesSelect.dispatchEvent(new Event('change'));
    }
}

/**
 * Navigate between sections
 */
function goToSection(sectionNum) {
    // Validate current section before moving forward
    if (sectionNum > currentSection && !validateCurrentSection()) {
        return;
    }

    // Collect data when leaving sections
    if (currentSection === 1) {
        collectRiskFactorData();
    } else if (currentSection === 2) {
        collectGoalsData();
    } else if (currentSection === 3) {
        collectMedicationData();
    }

    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const sectionIds = {
        1: 'section-risk-factors',
        2: 'section-goals',
        3: 'section-medications',
        4: 'section-results'
    };

    document.getElementById(sectionIds[sectionNum]).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < sectionNum) {
            step.classList.add('completed');
        } else if (index + 1 === sectionNum) {
            step.classList.add('active');
        }
    });

    currentSection = sectionNum;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Validate current section has minimum required data
 */
function validateCurrentSection() {
    if (currentSection === 1) {
        const age = document.getElementById('age').value;
        const sex = document.getElementById('sex').value;
        if (!age || !sex) {
            alert('Please enter at least your age and sex to continue.');
            return false;
        }
    } else if (currentSection === 2) {
        const gocValue = document.getElementById('goc-value').value;
        if (!gocValue) {
            alert('Please select your treatment philosophy to continue.');
            return false;
        }
    }
    return true;
}

/**
 * Collect risk factor data from form
 */
function collectRiskFactorData() {
    patientData = {
        // Demographics
        age: parseInt(document.getElementById('age').value) || null,
        sex: document.getElementById('sex').value || null,
        race: document.getElementById('race').value || null,
        weight: parseFloat(document.getElementById('weight').value) || null,
        height: parseFloat(document.getElementById('height').value) || null,

        // CV Risk Factors
        systolicBP: parseInt(document.getElementById('systolic-bp').value) || null,
        diastolicBP: parseInt(document.getElementById('diastolic-bp').value) || null,
        totalCholesterol: parseInt(document.getElementById('total-cholesterol').value) || null,
        ldl: parseInt(document.getElementById('ldl').value) || null,
        hdl: parseInt(document.getElementById('hdl').value) || null,
        triglycerides: parseInt(document.getElementById('triglycerides').value) || null,
        htnTreatment: document.getElementById('htn-treatment').checked,
        smoker: document.getElementById('smoker').checked,
        formerSmoker: document.getElementById('former-smoker').checked,
        familyHxCAD: document.getElementById('family-hx-cad').checked,

        // Diabetes
        diabetesStatus: document.getElementById('diabetes-status').value,
        a1c: parseFloat(document.getElementById('a1c').value) || null,
        diabetesDuration: parseInt(document.getElementById('diabetes-duration').value) || null,
        fastingGlucose: parseInt(document.getElementById('fasting-glucose').value) || null,

        // Heart & Kidney
        ef: parseInt(document.getElementById('ef').value) || null,
        nyha: document.getElementById('nyha').value,
        creatinine: parseFloat(document.getElementById('creatinine').value) || null,
        egfr: parseInt(document.getElementById('egfr').value) || null,
        uacr: parseInt(document.getElementById('uacr').value) || null,
        bnp: parseInt(document.getElementById('bnp').value) || null,

        // AFib & Stroke
        afib: document.getElementById('afib').checked,
        priorStroke: document.getElementById('prior-stroke').checked,
        priorMI: document.getElementById('prior-mi').checked,
        pvd: document.getElementById('pvd').checked,
        chfHistory: document.getElementById('chf-history').checked,

        // Bleeding Risk
        priorBleed: document.getElementById('prior-bleed').checked,
        anemia: document.getElementById('anemia').checked,
        liverDisease: document.getElementById('liver-disease').checked,
        alcohol: document.getElementById('alcohol').checked,
        nsaidUse: document.getElementById('nsaid-use').checked,
        antiplatelet: document.getElementById('antiplatelet').checked,
        fallRisk: document.getElementById('fall-risk').checked,

        // Other
        copd: document.getElementById('copd').checked,
        osa: document.getElementById('osa').checked,
        depression: document.getElementById('depression').checked,
        dementia: document.getElementById('dementia').checked,
        cancer: document.getElementById('cancer').checked,
        frailty: document.getElementById('frailty').checked,
        osteoporosis: document.getElementById('osteoporosis').checked,
        gout: document.getElementById('gout').checked,
        asthma: document.getElementById('asthma').checked,
        neuropathy: document.getElementById('neuropathy').checked,
        hypothyroidism: document.getElementById('hypothyroidism').checked,
        fibromyalgia: document.getElementById('fibromyalgia').checked
    };

    // Calculate eGFR if not provided
    if (!patientData.egfr && patientData.creatinine && patientData.age) {
        const egfrResult = RiskCalculators.calculateEGFR(patientData);
        if (egfrResult) {
            patientData.egfr = egfrResult.egfr;
        }
    }
}

/**
 * Collect goals of care data
 */
function collectGoalsData() {
    patientData.goalsOfCare = parseInt(document.getElementById('goc-value').value) || 3;
    patientData.timeHorizon = parseInt(document.getElementById('time-horizon').value) || 5;
    patientData.pillBurdenTolerance = document.getElementById('pill-burden').value || 'moderate';
    patientData.costSensitivity = document.getElementById('cost-sensitivity').value || 'moderate';
    patientData.monitoringTolerance = document.getElementById('monitoring-tolerance').value || 'moderate';
}

/**
 * Collect current medications
 */
function collectMedicationData() {
    patientData.currentMedications = [];
    document.querySelectorAll('[data-med]:checked').forEach(checkbox => {
        patientData.currentMedications.push(checkbox.dataset.med);
    });
}

/**
 * Calculate results and display
 */
function calculateResults() {
    // Collect any remaining data
    collectMedicationData();

    // Calculate all risks
    calculatedRisks = RiskCalculators.calculateAllRisks(patientData);

    // Move to results section
    goToSection(4);

    // Display results
    displayGoalsSummary();
    displayRiskSummary();
    displayCurrentMedAnalysis();
    displayPotentialMedications();
}

/**
 * Display goals of care summary at top of results
 */
function displayGoalsSummary() {
    const container = document.getElementById('goals-summary');
    const preferences = getPreferences();

    const gocNames = {
        1: 'Comfort-Focused',
        2: 'Selective',
        3: 'Balanced',
        4: 'Proactive'
    };

    const gocDescriptions = {
        1: 'You prefer quality of life now and only want medications with very high proven benefit.',
        2: 'You want high-value treatments only, avoiding medications where burden outweighs benefit.',
        3: 'You want reasonable prevention, accepting some burden for meaningful benefits.',
        4: 'You want to maximize prevention and are willing to take medications with any proven benefit.'
    };

    const gocThresholds = {
        1: 3.0,
        2: 1.0,
        3: 0.3,
        4: 0.0
    };

    const goc = preferences.goalsOfCare || 3;
    const gocClass = ['comfort', 'selective', 'balanced', 'proactive'][goc - 1];

    let costText = '';
    if (preferences.costSensitivity === 'high') {
        costText = ' Cost is an important consideration for you.';
    }

    container.innerHTML = `
        <div class="goals-summary-content">
            <div class="goals-badge ${gocClass}">${gocNames[goc]}</div>
            <p>${gocDescriptions[goc]}${costText}</p>
            <p class="goals-threshold">Medications need a net benefit of at least <strong>${gocThresholds[goc]} QALYs per 100 patients per year</strong> to be recommended for you.</p>
        </div>
    `;
}

/**
 * Display risk summary
 */
function displayRiskSummary() {
    const container = document.getElementById('risk-summary');
    let html = '';

    // ASCVD Risk
    if (calculatedRisks.ascvd && calculatedRisks.ascvd.risk) {
        const risk = parseFloat(calculatedRisks.ascvd.risk);
        const riskClass = risk >= 20 ? 'high' : risk >= 7.5 ? 'moderate' : 'low';
        html += `
            <div class="risk-item ${riskClass}">
                <div class="risk-label">10-Year CV Risk (ASCVD)</div>
                <div class="risk-value">${calculatedRisks.ascvd.risk}%</div>
                <div class="risk-interpretation">${calculatedRisks.ascvd.interpretation}</div>
            </div>
        `;
    }

    // CHA2DS2-VASc (if AFib)
    if (calculatedRisks.chadsvasc) {
        const score = calculatedRisks.chadsvasc.score;
        const riskClass = score >= 2 ? 'high' : score === 1 ? 'moderate' : 'low';
        html += `
            <div class="risk-item ${riskClass}">
                <div class="risk-label">CHA₂DS₂-VASc Score</div>
                <div class="risk-value">${score}</div>
                <div class="risk-interpretation">Annual stroke risk: ${calculatedRisks.chadsvasc.annualStrokeRisk}%</div>
            </div>
        `;
    }

    // HAS-BLED (if AFib)
    if (calculatedRisks.hasbled) {
        const score = calculatedRisks.hasbled.score;
        const riskClass = score >= 3 ? 'high' : 'moderate';
        html += `
            <div class="risk-item ${riskClass}">
                <div class="risk-label">HAS-BLED Score</div>
                <div class="risk-value">${score}</div>
                <div class="risk-interpretation">Annual bleed risk: ${calculatedRisks.hasbled.annualBleedRisk}%</div>
            </div>
        `;
    }

    // Heart Failure Survival
    if (calculatedRisks.seattleHF && calculatedRisks.seattleHF.survival1yr) {
        const surv = parseInt(calculatedRisks.seattleHF.survival1yr);
        const riskClass = surv >= 85 ? 'low' : surv >= 70 ? 'moderate' : 'high';
        html += `
            <div class="risk-item ${riskClass}">
                <div class="risk-label">HF 1-Year Survival</div>
                <div class="risk-value">${surv}%</div>
                <div class="risk-interpretation">${calculatedRisks.seattleHF.interpretation}</div>
            </div>
        `;
    }

    // eGFR
    if (calculatedRisks.egfr) {
        const egfr = calculatedRisks.egfr.egfr;
        const riskClass = egfr >= 60 ? 'low' : egfr >= 30 ? 'moderate' : 'high';
        html += `
            <div class="risk-item ${riskClass}">
                <div class="risk-label">Kidney Function (eGFR)</div>
                <div class="risk-value">${egfr}</div>
                <div class="risk-interpretation">${calculatedRisks.egfr.stage}</div>
            </div>
        `;
    }

    // Diabetes risks
    if (calculatedRisks.ukpds) {
        const chdRisk = parseFloat(calculatedRisks.ukpds.chdRisk);
        const riskClass = chdRisk >= 20 ? 'high' : chdRisk >= 10 ? 'moderate' : 'low';
        html += `
            <div class="risk-item ${riskClass}">
                <div class="risk-label">10-Year CHD Risk (UKPDS)</div>
                <div class="risk-value">${chdRisk}%</div>
                <div class="risk-interpretation">Diabetes-related heart disease risk</div>
            </div>
        `;
    }

    container.innerHTML = html || '<p>Enter more health information to calculate your risk profile.</p>';
}

/**
 * Prepare preferences object for benefit engine
 */
function getPreferences() {
    return {
        goalsOfCare: patientData.goalsOfCare || 3,
        timeHorizon: patientData.timeHorizon || 5,
        pillBurdenTolerance: patientData.pillBurdenTolerance || 'moderate',
        costSensitivity: patientData.costSensitivity || 'moderate',
        monitoringTolerance: patientData.monitoringTolerance || 'moderate'
    };
}

/**
 * Display analysis of current medications
 */
function displayCurrentMedAnalysis() {
    const container = document.getElementById('current-meds-analysis');
    const preferences = getPreferences();

    if (!patientData.currentMedications || patientData.currentMedications.length === 0) {
        container.innerHTML = '<p>No current medications selected.</p>';
        return;
    }

    let html = '';
    try {
        const analyses = patientData.currentMedications
            .map(medId => {
                const med = getMedication(medId);
                if (!med) {
                    console.warn('Medication not found:', medId);
                    return null;
                }
                try {
                    return BenefitEngine.calculateNetBenefit(med, patientData, calculatedRisks, preferences);
                } catch (e) {
                    console.error('Error calculating benefit for', medId, e);
                    return null;
                }
            })
            .filter(a => a !== null)
            .sort((a, b) => b.netBenefit - a.netBenefit);

        analyses.forEach(analysis => {
            html += renderMedicationResult(analysis, true);
        });
    } catch (e) {
        console.error('Error in displayCurrentMedAnalysis:', e);
        html = '<p>Error analyzing medications. Check console for details.</p>';
    }

    container.innerHTML = html || '<p>No medications could be analyzed.</p>';
}

/**
 * Display potential medications to consider - best in each class only
 */
function displayPotentialMedications() {
    const container = document.getElementById('potential-meds');
    const preferences = getPreferences();

    try {
        const allMeds = getAllMedications();
        const currentMedIds = patientData.currentMedications || [];

        // Get classes of medications the patient is already taking
        const currentClasses = new Set();
        currentMedIds.forEach(medId => {
            const med = getMedication(medId);
            if (med) currentClasses.add(med.class);
        });

        // Calculate benefits for all medications not currently being taken
        const allAnalyses = allMeds
            .filter(med => !currentMedIds.includes(med.id))
            .map(med => BenefitEngine.calculateNetBenefit(med, patientData, calculatedRisks, preferences))
            .filter(a => a !== null && a.netBenefit > 0 && a.applicableIndications.length > 0);

        // Group by class and pick the best in each class
        const bestByClass = {};
        allAnalyses.forEach(analysis => {
            const medClass = analysis.medicationClass;
            if (!bestByClass[medClass] || analysis.netBenefit > bestByClass[medClass].netBenefit) {
                bestByClass[medClass] = analysis;
            }
        });

        // Convert to array, sort by benefit, and filter
        let potentialMeds = Object.values(bestByClass)
            .sort((a, b) => b.netBenefit - a.netBenefit);

        // Separate into new classes vs. potential switches
        const newClassMeds = potentialMeds.filter(a => !currentClasses.has(a.medicationClass));
        const switchMeds = potentialMeds.filter(a => currentClasses.has(a.medicationClass));

        let html = '';

        // Show new class recommendations first
        if (newClassMeds.length > 0) {
            html += '<div class="potential-section"><h4>New Medications to Consider</h4>';
            newClassMeds.slice(0, 5).forEach(analysis => {
                html += renderMedicationResult(analysis, false);
            });
            html += '</div>';
        }

        // Show potential switches if there are better options in the same class
        if (switchMeds.length > 0) {
            // Check if the switch is actually better than what they're taking
            const worthwhileSwitches = switchMeds.filter(analysis => {
                // Find current med in same class
                const currentInClass = currentMedIds.find(medId => {
                    const med = getMedication(medId);
                    return med && med.class === analysis.medicationClass;
                });
                if (currentInClass) {
                    const currentMed = getMedication(currentInClass);
                    const currentAnalysis = BenefitEngine.calculateNetBenefit(currentMed, patientData, calculatedRisks, preferences);
                    // Only suggest switch if significantly better (>0.5 QALY improvement)
                    return currentAnalysis && (analysis.netBenefit - currentAnalysis.netBenefit) > 0.5;
                }
                return false;
            });

            if (worthwhileSwitches.length > 0) {
                html += '<div class="potential-section"><h4>Potential Switches Within Class</h4>';
                html += '<p class="switch-note">These may offer better benefit than your current medication in the same class</p>';
                worthwhileSwitches.forEach(analysis => {
                    html += renderMedicationResult(analysis, false, false, true);
                });
                html += '</div>';
            }
        }

        if (html === '') {
            html = '<p>No additional high-benefit medications identified based on your profile and goals.</p>';
        }

        container.innerHTML = html;
    } catch (e) {
        console.error('Error in displayPotentialMedications:', e);
        container.innerHTML = '<p>Error analyzing potential medications.</p>';
    }
}

/**
 * Generate unique ID for medication cards
 */
let medCardCounter = 0;

/**
 * Render a medication result card - simplified, intuitive design
 * @param {object} analysis - The medication analysis
 * @param {boolean} isCurrent - Whether this is a current medication
 * @param {boolean} isDeprescribe - Deprecated, kept for compatibility
 * @param {boolean} isSwitch - Whether this is a potential switch from current med
 */
function renderMedicationResult(analysis, isCurrent, isDeprescribe = false, isSwitch = false) {
    const netBenefit = analysis.netBenefit;
    const cardId = `med-card-${medCardCounter++}`;

    // Determine recommendation status and icon
    let statusClass, statusIcon, statusText;
    const rec = analysis.recommendation;

    if (rec === 'strongly-recommended') {
        statusClass = 'status-strong';
        statusIcon = '++';
        statusText = 'Strongly Recommended';
    } else if (rec === 'recommended') {
        statusClass = 'status-recommended';
        statusIcon = '+';
        statusText = 'Recommended';
    } else if (rec === 'consider') {
        statusClass = 'status-consider';
        statusIcon = '?';
        statusText = 'Consider';
    } else if (rec === 'caution-elderly') {
        statusClass = 'status-caution-elderly';
        statusIcon = '!';
        statusText = 'Caution - Beers Criteria';
    } else if (rec === 'marginal') {
        statusClass = 'status-marginal';
        statusIcon = '-';
        statusText = 'Marginal Benefit';
    } else {
        statusClass = 'status-not-recommended';
        statusIcon = 'X';
        statusText = 'Not Recommended';
    }

    // Get medication details
    const med = getMedication(analysis.medicationId);
    const burdenLevel = analysis.burdenLevel || 'low';
    const costDisplay = med ? `$${med.annualCost}/yr` : '';

    // Get purpose info
    const purpose = med ? med.purpose : 'disease_modifying';
    const purposeInfo = PURPOSE_INFO[purpose] || PURPOSE_INFO.disease_modifying;
    const purposeLabel = purposeInfo.shortLabel;

    // Create simple benefit/harm summary
    const benefitOutcomes = analysis.benefits.map(b => formatOutcomeName(b.outcome)).slice(0, 2);
    const benefitSummary = benefitOutcomes.length > 0 ? benefitOutcomes.join(', ') : 'No applicable benefits';

    // Build expandable details section
    let detailsHtml = '<div class="details-content">';

    // Benefits detail
    if (analysis.benefits.length > 0) {
        detailsHtml += '<div class="detail-section benefits-detail"><h5>Benefits</h5><ul>';
        analysis.benefits.forEach(b => {
            const nntDisplay = b.nnt ? `NNT ${b.nnt}` : `${((b.rrr || 0) * 100).toFixed(0)}% reduction`;
            detailsHtml += `<li><strong>${formatOutcomeName(b.outcome)}</strong>: ${nntDisplay} → +${b.expectedBenefit.toFixed(2)} QALYs</li>`;
        });
        detailsHtml += '</ul></div>';
    }

    // Harms detail
    if (analysis.harms.length > 0) {
        detailsHtml += '<div class="detail-section harms-detail"><h5>Serious Risks</h5><ul>';
        analysis.harms.forEach(h => {
            detailsHtml += `<li><strong>${formatOutcomeName(h.harm)}</strong>: NNH ${h.nnh} (${h.annualRisk}/yr) → −${h.expectedHarm.toFixed(2)} QALYs</li>`;
        });
        detailsHtml += '</ul></div>';
    } else {
        detailsHtml += '<div class="detail-section harms-detail"><h5>Serious Risks</h5><p>No significant serious harms identified from trial data.</p></div>';
    }

    // Burden detail
    detailsHtml += `<div class="detail-section burden-detail"><h5>Burden</h5><p>${analysis.burdenDetails || 'No specific burden information.'}</p></div>`;

    // Net calculation
    detailsHtml += `<div class="detail-section calc-detail"><h5>Calculation</h5>
        <p>Benefit (+${analysis.totalBenefit.toFixed(2)}) - Harm (${analysis.totalHarm.toFixed(2)}) = <strong>${netBenefit.toFixed(2)} QALYs</strong> per 100 patients per year</p>
    </div>`;

    detailsHtml += '</div>';

    // Beers Criteria / Elderly Safety Warning
    let beersWarningHtml = '';
    if (analysis.beersWarning && analysis.beersWarning.listed) {
        beersWarningHtml = `
            <div class="beers-warning">
                <div class="beers-warning-header">Beers Criteria Medication</div>
                <div class="beers-warning-content">${analysis.beersWarning.concern}</div>
                <div class="beers-warning-recommendation">${analysis.beersWarning.recommendation}</div>
            </div>
        `;
    } else if (analysis.elderlyCaution && analysis.elderlyCaution.hasWarnings) {
        const warningsList = analysis.elderlyCaution.warnings
            .map(w => `<li class="severity-${w.severity}">${w.message}</li>`)
            .join('');
        beersWarningHtml = `
            <div class="beers-warning">
                <div class="beers-warning-header">Elderly Caution</div>
                <ul class="elderly-caution-list">${warningsList}</ul>
            </div>
        `;
    }

    // Build the card
    return `
        <div class="med-card ${statusClass}" id="${cardId}">
            <div class="med-card-header" onclick="toggleDetails('${cardId}')">
                <div class="med-status-icon">${statusIcon}</div>
                <div class="med-main-info">
                    <div class="med-name">${analysis.medicationName}</div>
                    <div class="med-class">${analysis.medicationClass}</div>
                </div>
                <div class="med-quick-stats">
                    <div class="med-net-benefit">${netBenefit >= 0 ? '+' : ''}${netBenefit.toFixed(1)}</div>
                    <div class="med-net-label">net benefit</div>
                </div>
                <div class="med-tags">
                    <span class="tag purpose-${purpose}" title="${purposeInfo.description}">${purposeLabel}</span>
                    <span class="tag burden-${burdenLevel}">${burdenLevel}</span>
                    <span class="tag cost-tag">${costDisplay}</span>
                </div>
                <div class="expand-arrow">▼</div>
            </div>
            <div class="med-card-summary">
                <span class="status-text">${statusText}</span>
                <span class="benefit-for">${benefitSummary}</span>
            </div>
            ${beersWarningHtml}
            <div class="med-card-details" id="${cardId}-details" style="display: none;">
                ${detailsHtml}
            </div>
        </div>
    `;
}

/**
 * Toggle calculation details visibility
 */
function toggleDetails(cardId) {
    const details = document.getElementById(`${cardId}-details`);
    const card = document.getElementById(cardId);

    if (details.style.display === 'none') {
        details.style.display = 'block';
        card.classList.add('expanded');
    } else {
        details.style.display = 'none';
        card.classList.remove('expanded');
    }
}

/**
 * Format outcome name for display
 */
function formatOutcomeName(name) {
    const mapping = {
        'death': 'Death',
        'all_cause_mortality': 'All-cause mortality',
        'cv_death': 'CV death',
        'mortality': 'Mortality',
        'stroke_any': 'Stroke',
        'stroke_disabling': 'Disabling stroke',
        'mi_nonfatal': 'Heart attack (MI)',
        'mi_fatal': 'Fatal MI',
        'hf_hospitalization': 'HF hospitalization',
        'heart_failure_hospitalization': 'HF hospitalization',
        'cv_death_hf_hosp': 'CV death/HF hospitalization',
        'hospitalization': 'Hospitalization',
        'mace': 'Major CV events',
        'mace_composite': 'Major CV events',
        'stroke': 'Stroke',
        'kidney_progression': 'Kidney disease progression',
        'major_bleeding': 'Major bleeding',
        'intracranial_bleeding': 'Brain bleeding',
        'gi_bleeding': 'GI bleeding',
        'hypoglycemia': 'Low blood sugar',
        'hypotension': 'Low blood pressure',
        'hyperkalemia': 'High potassium',
        'genital_mycotic_infection': 'Yeast infection',
        'uti': 'Urinary infection',
        'dka': 'Diabetic ketoacidosis',
        'gynecomastia': 'Breast enlargement',
        'myalgia': 'Muscle pain',
        'fatigue': 'Fatigue',
        'bradycardia': 'Slow heart rate',
        'weight_gain': 'Weight gain',
        'gi_side_effects': 'GI upset',
        'angioedema': 'Severe swelling'
    };
    return mapping[name] || name.replace(/_/g, ' ');
}

/**
 * Print results
 */
function printResults() {
    window.print();
}

// ============================================
// AI IMPORT FUNCTIONALITY
// ============================================

/**
 * Initialize AI Import tabs
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeAIImportTabs();
});

function initializeAIImportTabs() {
    const tabs = document.querySelectorAll('.ai-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update active content
            document.querySelectorAll('.ai-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

/**
 * Copy EMR prompt to clipboard
 */
function copyEMRPrompt() {
    const promptText = document.getElementById('emr-prompt-text').textContent;
    navigator.clipboard.writeText(promptText).then(() => {
        const btn = document.querySelector('.copy-prompt-btn');
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = '📋 Copy Prompt';
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy prompt. Please select and copy manually.');
    });
}

/**
 * Clear paste input
 */
function clearPasteInput() {
    document.getElementById('ai-paste-input').value = '';
    const statusDiv = document.getElementById('ai-extract-status');
    statusDiv.className = 'ai-extract-status';
    statusDiv.textContent = '';
}

/**
 * Extract data from pasted text and fill form
 */
function extractFromPaste() {
    const inputText = document.getElementById('ai-paste-input').value.trim();
    const statusDiv = document.getElementById('ai-extract-status');

    if (!inputText) {
        statusDiv.className = 'ai-extract-status error';
        statusDiv.textContent = 'Please paste some text to extract data from.';
        return;
    }

    // Try to parse as JSON first
    let extractedData = null;

    try {
        // Check if it looks like JSON
        if (inputText.startsWith('{') || inputText.startsWith('[')) {
            extractedData = JSON.parse(inputText);
            statusDiv.className = 'ai-extract-status info';
            statusDiv.textContent = 'JSON detected. Processing...';
        }
    } catch (e) {
        // Not valid JSON, will try text extraction
    }

    if (extractedData) {
        // Process JSON data
        fillFormFromExtractedData(extractedData);
        statusDiv.className = 'ai-extract-status success';
        statusDiv.textContent = '✓ Data extracted and form populated! Please review the values below.';
    } else {
        // Try simple text extraction for non-JSON input
        const textExtracted = extractFromPlainText(inputText);
        if (textExtracted) {
            fillFormFromExtractedData(textExtracted);
            statusDiv.className = 'ai-extract-status success';
            statusDiv.textContent = '✓ Text parsed and form populated! Please review the values below.';
        } else {
            statusDiv.className = 'ai-extract-status error';
            statusDiv.textContent = 'Could not parse the input. Please paste valid JSON from the EMR AI, or try structured clinical notes.';
        }
    }
}

/**
 * Extract data from plain text (simple pattern matching)
 */
function extractFromPlainText(text) {
    const data = {};
    const textLower = text.toLowerCase();

    // Age extraction
    const ageMatch = text.match(/(?:age|aged?)[\s:]+(\d+)/i) || text.match(/(\d+)\s*(?:year|yr|yo|y\/o)/i);
    if (ageMatch) data.age = parseInt(ageMatch[1]);

    // Sex extraction
    if (textLower.includes('male') && !textLower.includes('female')) data.sex = 'male';
    else if (textLower.includes('female')) data.sex = 'female';

    // Blood pressure
    const bpMatch = text.match(/(?:bp|blood pressure)[\s:]*(\d+)\s*\/\s*(\d+)/i);
    if (bpMatch) {
        data.systolic_bp = parseInt(bpMatch[1]);
        data.diastolic_bp = parseInt(bpMatch[2]);
    }

    // Labs
    const a1cMatch = text.match(/(?:hba1c|a1c|hemoglobin a1c)[\s:]*(\d+\.?\d*)/i);
    if (a1cMatch) data.a1c = parseFloat(a1cMatch[1]);

    const crMatch = text.match(/(?:creatinine|cr)[\s:]*(\d+\.?\d*)/i);
    if (crMatch) data.creatinine = parseFloat(crMatch[1]);

    const egfrMatch = text.match(/(?:egfr|gfr)[\s:]*(\d+)/i);
    if (egfrMatch) data.egfr = parseInt(egfrMatch[1]);

    const efMatch = text.match(/(?:ejection fraction|ef|lvef)[\s:]*(\d+)/i);
    if (efMatch) data.ef = parseInt(efMatch[1]);

    // Total cholesterol, LDL, HDL
    const tcMatch = text.match(/(?:total cholesterol|tc)[\s:]*(\d+)/i);
    if (tcMatch) data.total_cholesterol = parseInt(tcMatch[1]);

    const ldlMatch = text.match(/ldl[\s:]*(\d+)/i);
    if (ldlMatch) data.ldl = parseInt(ldlMatch[1]);

    const hdlMatch = text.match(/hdl[\s:]*(\d+)/i);
    if (hdlMatch) data.hdl = parseInt(hdlMatch[1]);

    // Conditions
    data.conditions = {};
    if (/(?:atrial fib|afib|a\-?fib|af(?:\s|$))/i.test(text)) data.conditions.afib = true;
    if (/(?:heart failure|hf|chf|hfref|hfpef)/i.test(text)) data.conditions.heart_failure = true;
    if (/(?:type 2 diabetes|t2dm|dm2|type ii)/i.test(text)) data.conditions.diabetes_type2 = true;
    if (/(?:hypertension|htn)/i.test(text)) data.conditions.hypertension = true;
    if (/(?:prior stroke|cva|tia)/i.test(text)) data.conditions.prior_stroke = true;
    if (/(?:prior mi|myocardial infarction|heart attack)/i.test(text)) data.conditions.prior_mi = true;
    if (/(?:ckd|chronic kidney|renal disease)/i.test(text)) data.conditions.ckd = true;
    if (/(?:copd|chronic obstructive)/i.test(text)) data.conditions.copd = true;
    if (/(?:dementia|cognitive impairment|alzheimer)/i.test(text)) data.conditions.dementia = true;
    if (/(?:osteoporosis|osteopenia|low bone density|t\-?score)/i.test(text)) data.conditions.osteoporosis = true;
    if (/(?:gout|hyperuricemia|uric acid)/i.test(text)) data.conditions.gout = true;
    if (/(?:asthma)/i.test(text)) data.conditions.asthma = true;
    if (/(?:neuropathy|peripheral neuropathy|diabetic neuropathy)/i.test(text)) data.conditions.neuropathy = true;
    if (/(?:hypothyroid|hashimoto|low thyroid)/i.test(text)) data.conditions.hypothyroidism = true;
    if (/(?:fibromyalgia)/i.test(text)) data.conditions.fibromyalgia = true;
    if (/(?:depression|anxiety|mdd|gad)/i.test(text)) data.conditions.depression = true;
    if (/(?:frail|debilitated|poor functional)/i.test(text)) data.conditions.frailty = true;
    if (/(?:cancer|malignancy|oncology)/i.test(text)) data.conditions.cancer = true;
    if (/(?:pvd|pad|peripheral artery|claudication)/i.test(text)) data.conditions.pvd = true;

    // Medications - look for common medication names
    data.medications = [];
    const medPatterns = [
        // Cardiovascular
        { pattern: /(?:metformin|glucophage)/i, med: 'metformin' },
        { pattern: /(?:apixaban|eliquis)/i, med: 'apixaban' },
        { pattern: /(?:rivaroxaban|xarelto)/i, med: 'rivaroxaban' },
        { pattern: /(?:dabigatran|pradaxa)/i, med: 'dabigatran' },
        { pattern: /(?:edoxaban|savaysa)/i, med: 'edoxaban' },
        { pattern: /(?:warfarin|coumadin)/i, med: 'warfarin' },
        { pattern: /(?:atorvastatin|lipitor)/i, med: 'atorvastatin' },
        { pattern: /(?:rosuvastatin|crestor)/i, med: 'rosuvastatin' },
        { pattern: /(?:simvastatin|zocor)/i, med: 'simvastatin' },
        { pattern: /(?:ezetimibe|zetia)/i, med: 'ezetimibe' },
        { pattern: /(?:lisinopril|zestril|prinivil)/i, med: 'lisinopril' },
        { pattern: /(?:enalapril|vasotec)/i, med: 'enalapril' },
        { pattern: /(?:losartan|cozaar)/i, med: 'losartan' },
        { pattern: /(?:valsartan|diovan)/i, med: 'valsartan' },
        { pattern: /(?:metoprolol|toprol)/i, med: 'metoprolol' },
        { pattern: /(?:carvedilol|coreg)/i, med: 'carvedilol' },
        { pattern: /(?:bisoprolol|zebeta)/i, med: 'bisoprolol' },
        { pattern: /(?:furosemide|lasix)/i, med: 'furosemide' },
        { pattern: /(?:bumetanide|bumex)/i, med: 'bumetanide' },
        { pattern: /(?:torsemide|demadex)/i, med: 'torsemide' },
        { pattern: /(?:spironolactone|aldactone)/i, med: 'spironolactone' },
        { pattern: /(?:eplerenone|inspra)/i, med: 'eplerenone' },
        { pattern: /(?:finerenone|kerendia)/i, med: 'finerenone' },
        { pattern: /(?:hydrochlorothiazide|hctz|microzide)/i, med: 'hydrochlorothiazide' },
        { pattern: /(?:chlorthalidone|hygroton)/i, med: 'chlorthalidone' },
        { pattern: /(?:digoxin|lanoxin)/i, med: 'digoxin' },
        // Diabetes
        { pattern: /(?:empagliflozin|jardiance)/i, med: 'empagliflozin' },
        { pattern: /(?:dapagliflozin|farxiga)/i, med: 'dapagliflozin' },
        { pattern: /(?:canagliflozin|invokana)/i, med: 'canagliflozin' },
        { pattern: /(?:semaglutide|ozempic|wegovy|rybelsus)/i, med: 'semaglutide' },
        { pattern: /(?:liraglutide|victoza|saxenda)/i, med: 'liraglutide' },
        { pattern: /(?:glipizide|glucotrol)/i, med: 'glipizide' },
        { pattern: /(?:sitagliptin|januvia)/i, med: 'sitagliptin' },
        { pattern: /(?:entresto|sacubitril)/i, med: 'sacubitril_valsartan' },
        { pattern: /(?:aspirin|asa\b)/i, med: 'aspirin' },
        { pattern: /(?:clopidogrel|plavix)/i, med: 'clopidogrel' },
        { pattern: /(?:amlodipine|norvasc)/i, med: 'amlodipine' },
        // Osteoporosis
        { pattern: /(?:alendronate|fosamax)/i, med: 'alendronate' },
        { pattern: /(?:risedronate|actonel)/i, med: 'risedronate' },
        { pattern: /(?:zoledronic|reclast|zometa)/i, med: 'zoledronic_acid' },
        { pattern: /(?:denosumab|prolia)/i, med: 'denosumab' },
        { pattern: /(?:teriparatide|forteo)/i, med: 'teriparatide' },
        { pattern: /(?:romosozumab|evenity)/i, med: 'romosozumab' },
        // Respiratory
        { pattern: /(?:advair)/i, med: 'fluticasone_salmeterol' },
        { pattern: /(?:spiriva|tiotropium)/i, med: 'tiotropium' },
        { pattern: /(?:trelegy)/i, med: 'fluticasone_umeclidinium_vilanterol' },
        // Gout
        { pattern: /(?:allopurinol|zyloprim)/i, med: 'allopurinol' },
        { pattern: /(?:febuxostat|uloric)/i, med: 'febuxostat' },
        { pattern: /(?:colchicine|colcrys)/i, med: 'colchicine' },
        // Pain/Neuro
        { pattern: /(?:gabapentin|neurontin)/i, med: 'gabapentin' },
        { pattern: /(?:pregabalin|lyrica)/i, med: 'pregabalin' },
        { pattern: /(?:duloxetine|cymbalta)/i, med: 'duloxetine' },
        // Other
        { pattern: /(?:omeprazole|prilosec)/i, med: 'omeprazole' },
        { pattern: /(?:levothyroxine|synthroid|levoxyl)/i, med: 'levothyroxine' },
        { pattern: /(?:repatha|evolocumab)/i, med: 'evolocumab' },
        { pattern: /(?:vascepa|icosapent)/i, med: 'icosapent_ethyl' }
    ];

    medPatterns.forEach(({ pattern, med }) => {
        if (pattern.test(text) && !data.medications.includes(med)) {
            data.medications.push(med);
        }
    });

    // Check if we extracted anything useful
    if (Object.keys(data).length > 2 || (data.age && data.sex)) {
        return data;
    }
    return null;
}

/**
 * Fill form fields from extracted data
 */
function fillFormFromExtractedData(data) {
    // Helper to safely set a value
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el && value !== null && value !== undefined) {
            el.value = value;
        }
    };

    // Helper to safely check a checkbox
    const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.checked = !!value;
        }
    };

    // Handle nested JSON format (from EMR prompt)
    if (data.demographics) {
        setValue('age', data.demographics.age);
        setValue('sex', data.demographics.sex);
        setValue('race', data.demographics.race);
        setValue('weight', data.demographics.weight_kg);
        setValue('height', data.demographics.height_cm);
    } else {
        // Handle flat format (from text extraction)
        setValue('age', data.age);
        setValue('sex', data.sex);
        setValue('race', data.race);
        setValue('weight', data.weight_kg || data.weight);
        setValue('height', data.height_cm || data.height);
    }

    // Vitals
    if (data.vitals) {
        setValue('systolic-bp', data.vitals.systolic_bp);
        setValue('diastolic-bp', data.vitals.diastolic_bp);
    } else {
        setValue('systolic-bp', data.systolic_bp);
        setValue('diastolic-bp', data.diastolic_bp);
    }

    // Labs
    const labs = data.labs || data;
    setValue('total-cholesterol', labs.total_cholesterol);
    setValue('ldl', labs.ldl);
    setValue('hdl', labs.hdl);
    setValue('triglycerides', labs.triglycerides);
    setValue('creatinine', labs.creatinine);
    setValue('egfr', labs.egfr);
    setValue('a1c', labs.a1c);
    setValue('fasting-glucose', labs.fasting_glucose);
    setValue('bnp', labs.bnp);
    setValue('uacr', labs.uacr);

    // Cardiac data
    const cardiac = data.cardiac || data;
    setValue('ef', cardiac.ejection_fraction || cardiac.ef);
    setValue('nyha', cardiac.nyha_class);
    setChecked('afib', cardiac.afib || (data.conditions && data.conditions.afib));
    setChecked('prior-stroke', cardiac.prior_stroke_tia || (data.conditions && data.conditions.prior_stroke));
    setChecked('prior-mi', cardiac.prior_mi || (data.conditions && data.conditions.prior_mi));
    setChecked('pvd', cardiac.pvd);
    setChecked('chf-history', cardiac.heart_failure || (data.conditions && data.conditions.heart_failure));

    // Diabetes
    if (data.diabetes) {
        const diabetesMap = {
            'none': 'none',
            'prediabetes': 'prediabetes',
            'type2': 'type2',
            'type 2': 'type2',
            'type1': 'type1',
            'type 1': 'type1'
        };
        setValue('diabetes-status', diabetesMap[data.diabetes.status] || data.diabetes.status);
        setValue('diabetes-duration', data.diabetes.duration_years);
    } else if (data.conditions && data.conditions.diabetes_type2) {
        setValue('diabetes-status', 'type2');
    }

    // Bleeding risks
    const bleed = data.bleeding_risks || {};
    setChecked('prior-bleed', bleed.prior_major_bleed);
    setChecked('anemia', bleed.anemia);
    setChecked('liver-disease', bleed.liver_disease);
    setChecked('alcohol', bleed.heavy_alcohol);
    setChecked('nsaid-use', bleed.nsaid_use);
    setChecked('antiplatelet', bleed.on_antiplatelet);
    setChecked('fall-risk', bleed.fall_risk);

    // Other conditions
    const other = data.other_conditions || data.conditions || {};
    setChecked('htn-treatment', other.hypertension_treated || other.hypertension);
    setChecked('smoker', other.current_smoker);
    setChecked('former-smoker', other.former_smoker);
    setChecked('family-hx-cad', other.family_hx_cad);
    setChecked('copd', other.copd);
    setChecked('osa', other.sleep_apnea);
    setChecked('depression', other.depression);
    setChecked('dementia', other.dementia);
    setChecked('cancer', other.active_cancer || other.cancer);
    setChecked('frailty', other.frailty);
    setChecked('osteoporosis', other.osteoporosis);
    setChecked('gout', other.gout);
    setChecked('asthma', other.asthma);
    setChecked('neuropathy', other.neuropathy);
    setChecked('hypothyroidism', other.hypothyroidism);
    setChecked('fibromyalgia', other.fibromyalgia);
    setChecked('pvd', other.pvd);

    // Medications
    const medications = data.current_medications || data.medications || [];
    if (medications.length > 0) {
        // First uncheck all
        document.querySelectorAll('[data-med]').forEach(el => el.checked = false);

        // Then check the ones that match
        medications.forEach(med => {
            const checkbox = document.querySelector(`[data-med="${med}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Trigger diabetes fields visibility update
    const diabetesSelect = document.getElementById('diabetes-status');
    if (diabetesSelect) {
        diabetesSelect.dispatchEvent(new Event('change'));
    }
}
