/**
 * Net Benefit Calculation Engine
 *
 * Core Formula:
 * Net Benefit = Σ(Expected Benefits) - Σ(Expected Harms) - Burden Penalty
 *
 * Where:
 * Expected Benefit = (1/NNT) × Severity Weight × 100 patients
 * Expected Harm = (1/NNH) × Severity Weight × 100 patients
 *
 * All values are annualized and expressed as "quality-adjusted life-years saved per 100 patients per year"
 */

const BenefitEngine = {

    /**
     * Severity weights for different outcomes
     * Scale: 0-1 where 1 = death equivalent (1 QALY lost)
     * Based on standard QALY/utility estimates from health economics literature
     *
     * These represent the QALY impact of experiencing the event once
     */
    OUTCOME_WEIGHTS: {
        // === BENEFITS (events prevented) ===
        death: 1.0,
        cv_death: 1.0,
        all_cause_mortality: 1.0,
        mortality: 1.0,

        stroke_disabling: 0.7,      // Permanent severe disability
        stroke_any: 0.4,            // Mix of disabling and non-disabling
        stroke: 0.4,

        mi_fatal: 1.0,
        mi_nonfatal: 0.2,           // ~2-3 months recovery, some permanent impact
        mi: 0.25,

        heart_failure_hospitalization: 0.15,  // ~2-3 week event, some lasting impact
        hf_hospitalization: 0.15,
        hospitalization: 0.1,
        cv_hospitalization: 0.1,

        cv_death_hf_hosp: 0.4,      // Composite - weighted average
        mace: 0.35,                 // Composite of MI, stroke, CV death
        mace_composite: 0.35,

        eskd_dialysis: 0.5,         // Major permanent impact on QOL
        kidney_progression: 0.3,
        esrd: 0.5,
        doubling_creatinine: 0.2,

        amputation: 0.4,
        blindness: 0.4,

        thromboembolism: 0.3,       // Valve thrombosis/embolism
        stroke_recurrence: 0.4,

        // Fractures (osteoporosis)
        hip_fracture: 0.5,          // High mortality, permanent disability in elderly
        vertebral_fracture: 0.2,    // Pain, disability, height loss
        nonvertebral_fracture: 0.15, // Wrist, arm, etc. - recoverable
        falls: 0.05,                // Single fall event

        // Respiratory
        exacerbations: 0.1,         // COPD/asthma exacerbation

        // Gout
        gout_flares: 0.02,          // Acute pain episode

        // Pain relief
        pain_relief: 0.15,          // 50% pain reduction (neuropathic)

        // Depression
        remission: 0.2,             // Depression remission

        // Limb events
        limb_events: 0.3,           // Major adverse limb events (amputation, revascularization)

        // Symptom relief (surrogate but clinically meaningful)
        symptom_relief: 0.1,
        congestion_relief: 0.1,

        // === HARMS (serious adverse events with NNH) ===
        // These are QALY losses per event

        // Bleeding events
        major_bleeding: 0.15,       // Hospitalization, transfusion, ~1-2 month recovery
        intracranial_bleeding: 0.6, // ICH - high mortality/disability
        gi_bleeding: 0.08,          // Usually recoverable, ~2-4 weeks
        fatal_bleeding: 1.0,

        // Metabolic
        severe_hypoglycemia: 0.05,  // Single episode, recoverable
        dka: 0.1,                   // ICU stay, ~1-2 week recovery
        new_onset_diabetes: 0.05,   // Chronic but manageable condition
        hypercalcemia: 0.05,        // Usually reversible

        // Renal
        aki: 0.1,                   // Acute event, usually recoverable
        hyperkalemia_severe: 0.08,  // K>6.0, may require hospitalization
        hyperkalemia: 0.05,         // Moderate hyperkalemia

        // Bone (from osteoporosis meds)
        atypical_femur_fracture: 0.4,  // Serious fracture
        osteonecrosis_jaw: 0.2,        // ONJ

        // Respiratory
        pneumonia: 0.1,             // Hospitalization, recovery
        pneumonia_copd: 0.15,       // More serious in COPD patients

        // CV harm
        cv_events: 0.3,             // CV death, MI, stroke
        cv_death: 1.0,
        afib: 0.1,                  // New onset AFib

        // Falls
        falls_elderly: 0.1,         // Falls in elderly on CNS meds

        // CNS effects in elderly (Beers Criteria medications)
        cns_depression: 0.15,       // Sedation, cognitive impairment, delirium risk
        cognitive_impairment: 0.2,  // Worsening cognition in elderly
        edema_worsening_hf: 0.1,    // Peripheral edema exacerbating HF

        // Discontinuation
        discontinuation_syndrome: 0.02, // Withdrawal symptoms

        // Other serious
        angioedema: 0.1,            // Can be life-threatening
        pancreatitis: 0.1,          // Hospitalization, 1-2 week recovery
        rhabdomyolysis: 0.15,       // Serious, hospitalization required
        hypersensitivity_syndrome: 0.2, // Drug hypersensitivity (allopurinol)
        diarrhea_severe: 0.02,      // Severe diarrhea (colchicine)
        amputation: 0.4             // Limb amputation
    },

    /**
     * Burden penalties (annual QALY decrement from taking the medication)
     * This now includes minor side effects (fatigue, nausea, etc.) plus:
     * - Pill burden
     * - Monitoring requirements
     * - Dietary restrictions
     * - Injection burden
     */
    BURDEN_PENALTIES: {
        low: 0.01,      // Once daily pill, no monitoring, minimal side effects
        moderate: 0.03, // Multiple daily doses OR regular monitoring OR common mild side effects (GI, fatigue)
        high: 0.06      // Frequent monitoring (INR), injections, significant side effects, dietary restrictions
    },

    /**
     * Calculate expected benefit for a single outcome using NNT
     *
     * @param {number} nnt - Number needed to treat (can be null if we need to calculate from RRR)
     * @param {number} baselineRisk - Annual probability of event (0-1) - used if NNT not provided
     * @param {number} rrr - Relative risk reduction (0-1) - used if NNT not provided
     * @param {string} outcomeType - Type of outcome for severity weighting
     * @param {number} timeframe - Years over which NNT was calculated (to annualize)
     * @returns {number} Expected benefit in QALYs per 100 patients per year
     */
    calculateExpectedBenefit: function(nnt, baselineRisk, rrr, outcomeType, timeframe = 1) {
        let annualNnt;

        if (nnt && nnt > 0) {
            // Annualize NNT if timeframe > 1 year
            // If NNT is 20 over 3 years, annual NNT is ~60
            annualNnt = nnt * timeframe;
        } else if (baselineRisk && rrr) {
            // Calculate NNT from baseline risk and RRR
            const arr = baselineRisk * rrr;
            if (arr > 0) {
                annualNnt = 1 / arr;
            } else {
                return 0;
            }
        } else {
            return 0;
        }

        const severityWeight = this.OUTCOME_WEIGHTS[outcomeType] || 0.2;

        // Benefit = (1/NNT) × severity × 100 patients
        // This gives QALYs saved per 100 patients per year
        const benefitPer100 = (1 / annualNnt) * severityWeight * 100;

        return benefitPer100;
    },

    /**
     * Calculate expected harm for a serious adverse event using NNH
     *
     * @param {number} nnh - Number needed to harm (annualized)
     * @param {string} harmType - Type of harm for severity weighting
     * @param {number} timeframe - Years over which NNH was calculated (to annualize)
     * @returns {number} Expected harm in QALYs lost per 100 patients per year
     */
    calculateExpectedHarm: function(nnh, harmType, timeframe = 1) {
        if (!nnh || nnh <= 0) return 0;

        // Annualize NNH if needed
        const annualNnh = nnh * timeframe;

        const severityWeight = this.OUTCOME_WEIGHTS[harmType] || 0.05;

        // Harm = (1/NNH) × severity × 100 patients
        const harmPer100 = (1 / annualNnh) * severityWeight * 100;

        return Math.max(0, harmPer100);
    },

    /**
     * Get baseline risk for an outcome based on patient data and risk calculators
     */
    getBaselineRisk: function(outcomeType, patientData, calculatedRisks) {
        switch (outcomeType) {
            // Cardiovascular outcomes
            case 'mace_composite':
            case 'mace':
            case 'cv_death':
                if (calculatedRisks.ascvd && calculatedRisks.ascvd.risk) {
                    return parseFloat(calculatedRisks.ascvd.risk) / 100 / 10; // Convert 10-yr to annual
                }
                return 0.02; // Default 2% annual

            case 'stroke_any':
            case 'stroke_disabling':
            case 'stroke':
                if (patientData.afib && calculatedRisks.chadsvasc) {
                    return calculatedRisks.chadsvasc.annualStrokeRisk / 100;
                }
                if (calculatedRisks.ascvd && calculatedRisks.ascvd.risk) {
                    return parseFloat(calculatedRisks.ascvd.risk) / 100 / 10 * 0.3; // ~30% of ASCVD is stroke
                }
                return 0.005; // Default 0.5% annual

            case 'mi_nonfatal':
            case 'mi_fatal':
            case 'mi':
                if (calculatedRisks.ascvd && calculatedRisks.ascvd.risk) {
                    return parseFloat(calculatedRisks.ascvd.risk) / 100 / 10 * 0.5; // ~50% of ASCVD is MI
                }
                return 0.01; // Default 1% annual

            // Heart failure outcomes
            case 'death':
            case 'all_cause_mortality':
            case 'mortality':
                if (patientData.ef && patientData.ef < 40) {
                    // HFrEF mortality based on Seattle model or estimate
                    if (calculatedRisks.seattleHF && calculatedRisks.seattleHF.survival1yr) {
                        return (100 - parseInt(calculatedRisks.seattleHF.survival1yr)) / 100;
                    }
                    return 0.15; // ~15% annual mortality in HFrEF
                }
                // General population mortality by age
                const ageMortality = {
                    40: 0.002, 50: 0.004, 60: 0.01, 70: 0.02, 80: 0.05, 90: 0.15
                };
                const age = patientData.age || 65;
                const ageKey = Math.min(90, Math.max(40, Math.floor(age / 10) * 10));
                return ageMortality[ageKey] || 0.02;

            case 'hf_hospitalization':
            case 'heart_failure_hospitalization':
            case 'hospitalization':
                if (patientData.ef && patientData.ef < 40) {
                    return 0.25; // ~25% annual HF hospitalization in HFrEF
                }
                if (patientData.chfHistory) {
                    return 0.15;
                }
                return 0.01;

            case 'cv_death_hf_hosp':
                if (patientData.ef && patientData.ef < 40) {
                    return 0.35; // Combined outcome in HFrEF
                }
                return 0.05;

            // Kidney outcomes
            case 'kidney_progression':
            case 'eskd_dialysis':
            case 'esrd':
                if (calculatedRisks.egfr) {
                    const egfr = calculatedRisks.egfr.egfr;
                    if (egfr < 30) return 0.10;
                    if (egfr < 45) return 0.05;
                    if (egfr < 60) return 0.02;
                }
                return 0.005;

            // Diabetes complications
            case 'blindness':
            case 'amputation':
                if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') {
                    const duration = patientData.diabetesDuration || 5;
                    return 0.005 + (duration * 0.001); // Increases with duration
                }
                return 0.001;

            default:
                return 0.01; // Default 1% for unknown outcomes
        }
    },

    /**
     * Main calculation: Net benefit for a medication
     *
     * @param {object} medication - Medication from database
     * @param {object} patientData - Patient characteristics
     * @param {object} calculatedRisks - Pre-calculated risk scores
     * @param {object} preferences - Patient preferences (goals of care, etc.)
     * @returns {object} Detailed net benefit calculation
     */
    calculateNetBenefit: function(medication, patientData, calculatedRisks, preferences) {
        const results = {
            medicationId: medication.id,
            medicationName: medication.name,
            medicationClass: medication.class,
            benefits: [],
            harms: [],
            totalBenefit: 0,
            totalHarm: 0,
            burdenPenalty: 0,
            netBenefit: 0,
            nntEquivalent: null,
            recommendation: '',
            applicableIndications: [],
            // Beers Criteria / elderly safety warnings
            beersWarning: null,
            elderlyCaution: null
        };

        // ========== CHECK BEERS CRITERIA / ELDERLY SAFETY ==========
        const elderlyCheck = this.checkElderlySafety(medication, patientData);
        results.beersWarning = elderlyCheck.beersWarning;
        results.elderlyCaution = elderlyCheck.elderlyCaution;

        // ========== ESTIMATE LIFE EXPECTANCY FOR COMPETING RISK ==========

        const lifeExpectancy = this.estimateLifeExpectancy(patientData, calculatedRisks);
        results.estimatedLifeExpectancy = lifeExpectancy;
        const userTimeHorizon = preferences.timeHorizon || 5;

        // ========== CALCULATE BENEFITS ==========

        // Check each indication and its benefits
        for (const [indication, outcomes] of Object.entries(medication.benefits)) {
            // Check if this indication applies to the patient
            const indicationApplies = this.checkIndicationApplies(indication, patientData, calculatedRisks);

            if (!indicationApplies.applies) continue;

            results.applicableIndications.push({
                indication: indication,
                reason: indicationApplies.reason
            });

            // Calculate benefit for each outcome
            for (const [outcomeName, outcomeData] of Object.entries(outcomes)) {
                // Skip non-RRR outcomes (like A1C reduction)
                if (!outcomeData.rrr && !outcomeData.nnt) continue;

                // Get baseline risk for this outcome
                const baselineRisk = this.getBaselineRisk(outcomeName, patientData, calculatedRisks);

                // Adjust for patient factors (adherence, etc.)
                const adjustmentFactor = this.getPatientAdjustmentFactor(patientData, medication, calculatedRisks, preferences);

                // Apply competing risk adjustment based on trial timeframe vs life expectancy
                const timeframe = outcomeData.timeframe || 1;
                const competingRiskFactor = this.getCompetingRiskFactor(timeframe, lifeExpectancy, userTimeHorizon);

                // Calculate expected benefit
                let expectedBenefit;

                if (outcomeData.nnt) {
                    expectedBenefit = this.calculateExpectedBenefit(
                        outcomeData.nnt,
                        null,
                        null,
                        outcomeName,
                        timeframe
                    );
                } else {
                    expectedBenefit = this.calculateExpectedBenefit(
                        null,
                        baselineRisk,
                        outcomeData.rrr * adjustmentFactor,
                        outcomeName,
                        1 // Already using annual baseline risk
                    );
                }

                // Apply competing risk reduction
                expectedBenefit *= competingRiskFactor;

                if (expectedBenefit > 0.001) { // Only include meaningful benefits
                    const severityWeight = this.OUTCOME_WEIGHTS[outcomeName] || 0.2;

                    // Calculate NNT for display
                    let displayNnt = outcomeData.nnt;
                    if (!displayNnt && baselineRisk && outcomeData.rrr) {
                        displayNnt = Math.round(1 / (baselineRisk * outcomeData.rrr));
                    }

                    results.benefits.push({
                        outcome: outcomeName,
                        indication: indication,
                        baselineRisk: baselineRisk,
                        rrr: outcomeData.rrr,
                        nnt: displayNnt,
                        timeframe: timeframe,
                        severityWeight: severityWeight,
                        expectedBenefit: expectedBenefit,
                        endpointQuality: outcomeData.quality || 'unknown'
                    });

                    results.totalBenefit += expectedBenefit;
                }
            }
        }

        // ========== CALCULATE HARMS (Using Risk Calculators When Available) ==========

        // Use HAS-BLED for bleeding risk on anticoagulants/antiplatelets
        const bleedingMedClasses = ['Direct Oral Anticoagulant (DOAC)', 'Vitamin K Antagonist', 'Antiplatelet'];
        const isBleedingRiskMed = bleedingMedClasses.some(c => medication.class.includes(c) || medication.class === c);

        if (isBleedingRiskMed && calculatedRisks.hasbled) {
            // Use HAS-BLED calculated bleeding risk instead of static NNH
            const annualBleedRisk = calculatedRisks.hasbled.annualBleedRisk / 100;
            const majorBleedSeverity = this.OUTCOME_WEIGHTS['major_bleeding'] || 0.15;
            const ichSeverity = this.OUTCOME_WEIGHTS['intracranial_bleeding'] || 0.6;

            // Major bleeding (most bleeds)
            const majorBleedHarm = annualBleedRisk * 0.85 * majorBleedSeverity * 100; // 85% of bleeds are non-ICH
            if (majorBleedHarm > 0.001) {
                results.harms.push({
                    harm: 'major_bleeding',
                    nnh: Math.round(100 / annualBleedRisk),
                    annualRisk: (annualBleedRisk * 100).toFixed(1) + '%',
                    timeframe: 1,
                    severityWeight: majorBleedSeverity,
                    expectedHarm: majorBleedHarm,
                    source: `HAS-BLED score ${calculatedRisks.hasbled.score}`
                });
                results.totalHarm += majorBleedHarm;
            }

            // ICH (about 10-15% of major bleeds on anticoagulation)
            const ichRisk = annualBleedRisk * 0.12;
            const ichHarm = ichRisk * ichSeverity * 100;
            if (ichHarm > 0.001) {
                results.harms.push({
                    harm: 'intracranial_bleeding',
                    nnh: Math.round(100 / ichRisk),
                    annualRisk: (ichRisk * 100).toFixed(2) + '%',
                    timeframe: 1,
                    severityWeight: ichSeverity,
                    expectedHarm: ichHarm,
                    source: `HAS-BLED score ${calculatedRisks.hasbled.score}`
                });
                results.totalHarm += ichHarm;
            }
        } else if (medication.harms) {
            // Use static NNH from medication database for non-bleeding harms
            for (const [harmName, harmData] of Object.entries(medication.harms)) {
                // Skip bleeding harms if we already calculated them above
                if (isBleedingRiskMed && (harmName.includes('bleeding') || harmName === 'major_bleeding' || harmName === 'intracranial_bleeding' || harmName === 'gi_bleeding')) {
                    continue;
                }

                if (!harmData.nnh) continue;

                const harmType = harmName;
                const severityWeight = this.OUTCOME_WEIGHTS[harmType] || 0.05;

                // Adjust NNH for patient factors
                const adjustedNnh = this.adjustNnhForPatient(harmData.nnh, harmName, patientData, calculatedRisks);
                const timeframe = harmData.timeframe || 1;

                const expectedHarm = this.calculateExpectedHarm(
                    adjustedNnh,
                    harmType,
                    timeframe
                );

                if (expectedHarm > 0.0001) {
                    results.harms.push({
                        harm: harmName,
                        nnh: adjustedNnh,
                        annualRisk: ((1 / adjustedNnh) * 100).toFixed(2) + '%',
                        timeframe: timeframe,
                        severityWeight: severityWeight,
                        expectedHarm: expectedHarm,
                        source: harmData.source || 'clinical trial'
                    });

                    results.totalHarm += expectedHarm;
                }
            }
        }

        // Add hypoglycemia risk for diabetes meds based on patient factors
        const hypoglycemiaMeds = ['Sulfonylurea'];
        if (hypoglycemiaMeds.some(c => medication.class.includes(c))) {
            let hypoRisk = 0.02; // 2% baseline severe hypoglycemia
            if (patientData.age >= 75) hypoRisk *= 2;
            if (calculatedRisks.egfr && calculatedRisks.egfr.egfr < 45) hypoRisk *= 1.5;

            const hypoSeverity = this.OUTCOME_WEIGHTS['severe_hypoglycemia'] || 0.05;
            const hypoHarm = hypoRisk * hypoSeverity * 100;

            if (hypoHarm > 0.001) {
                results.harms.push({
                    harm: 'severe_hypoglycemia',
                    nnh: Math.round(1 / hypoRisk),
                    annualRisk: (hypoRisk * 100).toFixed(1) + '%',
                    timeframe: 1,
                    severityWeight: hypoSeverity,
                    expectedHarm: hypoHarm,
                    source: 'Patient-adjusted estimate'
                });
                results.totalHarm += hypoHarm;
            }
        }

        // ========== CALCULATE BURDEN ==========

        let burdenLevel = medication.burden || 'moderate';

        // Adjust burden based on patient preferences
        if (preferences.pillBurdenTolerance === 'low') {
            burdenLevel = burdenLevel === 'low' ? 'moderate' :
                         burdenLevel === 'moderate' ? 'high' : 'high';
        }

        results.burdenLevel = burdenLevel;
        results.burdenPenalty = this.BURDEN_PENALTIES[burdenLevel] * 100; // per 100 patients
        results.burdenDetails = medication.burdenDetails || '';

        // Add cost penalty if cost-sensitive
        if (preferences.costSensitivity === 'high' && medication.annualCost > 2000) {
            results.burdenPenalty += 0.5; // Additional penalty for expensive meds
        } else if (preferences.costSensitivity === 'moderate' && medication.annualCost > 5000) {
            results.burdenPenalty += 0.3;
        }

        // ========== CALCULATE NET BENEFIT ==========
        // Net benefit = benefits - harms only (burden is displayed separately)

        results.totalBenefit = Math.round(results.totalBenefit * 1000) / 1000;
        results.totalHarm = Math.round(results.totalHarm * 1000) / 1000;
        results.netBenefit = results.totalBenefit - results.totalHarm;
        results.netBenefit = Math.round(results.netBenefit * 1000) / 1000;

        // Convert to NNT-equivalent (how many patients to treat for 1 year to get 1 QALY)
        if (results.netBenefit > 0) {
            results.nntEquivalent = Math.round(100 / results.netBenefit);
        }

        // ========== APPLY GOALS OF CARE THRESHOLD ==========

        // Thresholds for 4 goals of care levels (QALYs per 100 patients per year)
        const gocThresholds = {
            1: 3.0,   // Comfort-focused: need very high net benefit
            2: 1.0,   // Selective: need good net benefit
            3: 0.3,   // Balanced: need modest net benefit
            4: 0.0    // Proactive: accept any positive benefit
        };

        const gocNames = {
            1: 'Comfort-Focused',
            2: 'Selective',
            3: 'Balanced',
            4: 'Proactive'
        };

        const goc = preferences.goalsOfCare || 3;
        const threshold = gocThresholds[goc];
        results.gocName = gocNames[goc];
        results.gocThreshold = threshold;

        // Determine recommendation based on net benefit, burden, cost, and elderly safety
        const isHighBurden = (results.burdenLevel || 'low') === 'high';
        const isHighCost = medication.annualCost > 3000;

        // Check for Beers Criteria / elderly safety concerns
        const hasBeersWarning = results.beersWarning && results.beersWarning.listed;
        const hasHighSeverityElderlyWarning = results.elderlyCaution &&
            results.elderlyCaution.overallSeverity === 'high';
        const shouldAvoidInFrail = results.elderlyCaution && results.elderlyCaution.avoidRecommended;
        const isElderly = patientData.age >= 65;
        const isFrail = patientData.frailty;

        if (results.netBenefit < 0) {
            results.recommendation = 'not-recommended';
            results.recommendationText = 'Expected harms outweigh benefits';
        } else if (shouldAvoidInFrail) {
            // Strong recommendation to avoid in frail patients with high-risk medications
            results.recommendation = 'caution-elderly';
            results.recommendationText = 'Avoid in frail patients - high risk of adverse events (Beers Criteria)';
        } else if (hasBeersWarning && hasHighSeverityElderlyWarning && isElderly) {
            // Beers medication with high severity warnings in elderly
            if (results.netBenefit >= threshold && results.netBenefit >= 1.0) {
                // Still has meaningful benefit - recommend with strong caution
                results.recommendation = 'caution-elderly';
                results.recommendationText = 'Potential benefit but Beers Criteria medication - discuss safer alternatives';
            } else {
                // Marginal benefit + high risk = not recommended
                results.recommendation = 'not-recommended';
                results.recommendationText = 'Beers Criteria medication with limited benefit in this patient - avoid';
            }
        } else if (hasBeersWarning && isElderly) {
            // Beers medication with moderate concerns
            if (results.netBenefit >= threshold) {
                results.recommendation = 'caution-elderly';
                results.recommendationText = 'Beers Criteria medication - use lowest dose, monitor closely';
            } else {
                results.recommendation = 'marginal';
                results.recommendationText = 'Beers Criteria medication with limited benefit - consider alternatives';
            }
        } else if (results.netBenefit >= threshold) {
            // Meets threshold - but modify based on burden/cost/elderly caution
            if (results.netBenefit >= 3.0) {
                results.recommendation = 'strongly-recommended';
                results.recommendationText = 'High net benefit - strongly recommended';
            } else if (hasHighSeverityElderlyWarning && isElderly) {
                results.recommendation = 'consider';
                results.recommendationText = 'Good benefit but use caution in elderly - monitor closely';
            } else if (isHighBurden && goc <= 2) {
                results.recommendation = 'consider';
                results.recommendationText = 'Good benefit but high burden - discuss with your doctor';
            } else if (isHighCost && preferences.costSensitivity === 'high') {
                results.recommendation = 'consider';
                results.recommendationText = 'Good benefit but high cost - discuss alternatives';
            } else {
                results.recommendation = 'recommended';
                results.recommendationText = 'Net benefit meets your goals';
            }
        } else {
            // Below threshold
            if (results.netBenefit > 0) {
                results.recommendation = 'marginal';
                results.recommendationText = `Benefit below your ${gocNames[goc].toLowerCase()} threshold`;
            } else {
                results.recommendation = 'not-recommended';
                results.recommendationText = 'No net benefit expected';
            }
        }

        return results;
    },

    /**
     * Check if an indication applies to this patient
     */
    checkIndicationApplies: function(indication, patientData, calculatedRisks) {
        switch (indication) {
            case 'heart_failure':
            case 'heart_failure_symptoms':
                if (patientData.ef && patientData.ef < 50) {
                    return { applies: true, reason: 'EF < 50%' };
                }
                if (parseInt(patientData.nyha) >= 1) {
                    return { applies: true, reason: 'Heart failure symptoms' };
                }
                if (patientData.chfHistory) {
                    return { applies: true, reason: 'History of heart failure' };
                }
                return { applies: false };

            case 'heart_failure_severe':
                if (patientData.ef && patientData.ef < 30) {
                    return { applies: true, reason: 'Severe HFrEF (EF < 30%)' };
                }
                if (parseInt(patientData.nyha) >= 3) {
                    return { applies: true, reason: 'NYHA III-IV symptoms' };
                }
                return { applies: false };

            case 'afib_stroke_prevention':
                if (patientData.afib) {
                    return { applies: true, reason: 'Atrial fibrillation' };
                }
                return { applies: false };

            case 'diabetes':
            case 'diabetes_cv':
            case 'diabetes_glycemic':
                if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') {
                    return { applies: true, reason: 'Diabetes mellitus' };
                }
                return { applies: false };

            case 'diabetes_with_cvd':
                if ((patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') &&
                    (patientData.priorMI || patientData.priorStroke || patientData.pvd)) {
                    return { applies: true, reason: 'Diabetes with established CVD' };
                }
                return { applies: false };

            case 'secondary_prevention':
            case 'post_mi':
                if (patientData.priorMI || patientData.priorStroke || patientData.pvd) {
                    return { applies: true, reason: 'Established cardiovascular disease' };
                }
                return { applies: false };

            case 'post_mi_with_lv_dysfunction':
                if (patientData.priorMI && patientData.ef && patientData.ef < 40) {
                    return { applies: true, reason: 'Post-MI with LV dysfunction' };
                }
                return { applies: false };

            case 'primary_prevention_high_risk':
                if (!patientData.priorMI && !patientData.priorStroke) {
                    if (calculatedRisks.ascvd && parseFloat(calculatedRisks.ascvd.risk) >= 7.5) {
                        return { applies: true, reason: 'High CV risk (ASCVD ≥7.5%)' };
                    }
                }
                return { applies: false };

            case 'primary_prevention':
            case 'primary_prevention_low_risk':
                if (!patientData.priorMI && !patientData.priorStroke) {
                    return { applies: true, reason: 'Primary prevention' };
                }
                return { applies: false };

            case 'ckd':
                if (calculatedRisks.egfr && calculatedRisks.egfr.egfr < 60) {
                    return { applies: true, reason: 'CKD (eGFR < 60)' };
                }
                if (patientData.uacr && patientData.uacr > 30) {
                    return { applies: true, reason: 'Albuminuria' };
                }
                return { applies: false };

            case 'diabetic_nephropathy':
                if ((patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') &&
                    calculatedRisks.egfr && calculatedRisks.egfr.egfr < 60) {
                    return { applies: true, reason: 'Diabetic nephropathy' };
                }
                return { applies: false };

            case 'hypertension':
                if (patientData.htnTreatment || patientData.systolicBP >= 130) {
                    return { applies: true, reason: 'Hypertension' };
                }
                return { applies: false };

            case 'acs':
            case 'stroke_secondary_prevention':
                if (patientData.priorMI || patientData.priorStroke) {
                    return { applies: true, reason: 'Secondary prevention' };
                }
                return { applies: false };

            case 'mechanical_valve':
                if (patientData.mechanicalValve) {
                    return { applies: true, reason: 'Mechanical heart valve' };
                }
                return { applies: false };

            // Osteoporosis indications
            case 'osteoporosis':
            case 'osteoporosis_severe':
                if (patientData.osteoporosis) {
                    return { applies: true, reason: 'Osteoporosis' };
                }
                // High-risk patients even without diagnosis
                if (patientData.age >= 65 && patientData.sex === 'female') {
                    return { applies: true, reason: 'High fracture risk (age ≥65, female)' };
                }
                if (patientData.age >= 75) {
                    return { applies: true, reason: 'High fracture risk (age ≥75)' };
                }
                return { applies: false };

            // Gout
            case 'gout':
            case 'gout_flare_treatment':
                if (patientData.gout) {
                    return { applies: true, reason: 'Gout' };
                }
                return { applies: false };

            // CV prevention (for colchicine, low-dose rivaroxaban)
            case 'cv_prevention':
            case 'stable_cad':
            case 'stable_cad_pad':
                if (patientData.priorMI || patientData.pvd) {
                    return { applies: true, reason: 'Stable CAD or PAD' };
                }
                return { applies: false };

            case 'pad':
                if (patientData.pvd) {
                    return { applies: true, reason: 'Peripheral artery disease' };
                }
                return { applies: false };

            // Respiratory
            case 'asthma':
                if (patientData.asthma) {
                    return { applies: true, reason: 'Asthma' };
                }
                return { applies: false };

            case 'copd':
                if (patientData.copd) {
                    return { applies: true, reason: 'COPD' };
                }
                return { applies: false };

            // GERD/PPI indications
            case 'gerd':
            case 'peptic_ulcer':
            case 'gi_bleed_prevention':
                // PPI indicated if on dual antiplatelet or high bleeding risk + anticoagulation
                if (patientData.antiplatelet && (patientData.priorMI || patientData.priorStroke)) {
                    return { applies: true, reason: 'GI protection with antithrombotics' };
                }
                return { applies: false };

            // Lipid/CV additions
            case 'hyperlipidemia':
            case 'secondary_prevention_addon':
                if (patientData.priorMI || patientData.priorStroke || patientData.pvd) {
                    return { applies: true, reason: 'Secondary CV prevention' };
                }
                return { applies: false };

            case 'cv_prevention_high_tg':
                // Icosapent ethyl - on statin with high TG
                if (patientData.triglycerides && patientData.triglycerides >= 150 &&
                    (patientData.priorMI || patientData.priorStroke || patientData.diabetesStatus === 'type2')) {
                    return { applies: true, reason: 'Elevated TG with high CV risk' };
                }
                return { applies: false };

            // Diabetic kidney disease (finerenone)
            case 'diabetic_kidney_disease':
                if ((patientData.diabetesStatus === 'type2') &&
                    ((calculatedRisks.egfr && calculatedRisks.egfr.egfr < 60) || (patientData.uacr && patientData.uacr > 30))) {
                    return { applies: true, reason: 'Diabetic kidney disease' };
                }
                return { applies: false };

            // Neuropathic pain
            case 'neuropathic_pain':
                if (patientData.neuropathy || (patientData.diabetesStatus === 'type2' && patientData.diabetesDuration >= 5)) {
                    return { applies: true, reason: 'Neuropathic pain' };
                }
                return { applies: false };

            case 'fibromyalgia':
                if (patientData.fibromyalgia) {
                    return { applies: true, reason: 'Fibromyalgia' };
                }
                return { applies: false };

            case 'depression':
            case 'anxiety':
                if (patientData.depression) {
                    return { applies: true, reason: 'Depression/anxiety' };
                }
                return { applies: false };

            // Thyroid
            case 'hypothyroidism':
                if (patientData.hypothyroidism) {
                    return { applies: true, reason: 'Hypothyroidism' };
                }
                return { applies: false };

            // Vitamin D
            case 'vitamin_d_deficiency':
            case 'osteoporosis_adjunct':
            case 'fall_prevention':
                if (patientData.osteoporosis || patientData.age >= 65) {
                    return { applies: true, reason: 'Vitamin D supplementation indicated' };
                }
                return { applies: false };

            // Edema
            case 'edema':
                if (patientData.chfHistory || (patientData.ef && patientData.ef < 50)) {
                    return { applies: true, reason: 'Volume overload/edema' };
                }
                return { applies: false };

            // Angina
            case 'angina':
                if (patientData.priorMI || patientData.stableAngina) {
                    return { applies: true, reason: 'Angina/CAD' };
                }
                return { applies: false };

            // VTE
            case 'vte_treatment':
                if (patientData.vte) {
                    return { applies: true, reason: 'VTE treatment' };
                }
                return { applies: false };

            // Seizures (gabapentin/pregabalin)
            case 'seizures':
                if (patientData.seizures) {
                    return { applies: true, reason: 'Seizure disorder' };
                }
                return { applies: false };

            // Obesity (semaglutide/liraglutide)
            case 'obesity':
                if (patientData.weight && patientData.height) {
                    const bmi = patientData.weight / Math.pow(patientData.height / 100, 2);
                    if (bmi >= 30) {
                        return { applies: true, reason: 'Obesity (BMI ≥30)' };
                    }
                }
                return { applies: false };

            // Rate control for AFib
            case 'afib_rate_control':
                if (patientData.afib) {
                    return { applies: true, reason: 'AFib rate control' };
                }
                return { applies: false };

            // Resistant hypertension
            case 'resistant_hypertension':
                if (patientData.htnTreatment && patientData.systolicBP >= 140) {
                    return { applies: true, reason: 'Resistant hypertension' };
                }
                return { applies: false };

            default:
                return { applies: false };
        }
    },

    /**
     * Estimate life expectancy based on age, sex, and comorbidities
     * Returns estimated years of remaining life
     * Based on actuarial tables adjusted for health status
     */
    estimateLifeExpectancy: function(patientData, calculatedRisks = {}) {
        // Base life expectancy by age and sex (US Social Security actuarial tables, approximate)
        const baseLifeExpectancy = {
            male: { 50: 30, 55: 26, 60: 22, 65: 18, 70: 15, 75: 12, 80: 8, 85: 6, 90: 4, 95: 3 },
            female: { 50: 33, 55: 29, 60: 25, 65: 21, 70: 17, 75: 13, 80: 10, 85: 7, 90: 5, 95: 3 }
        };

        const age = patientData.age || 65;
        const sex = patientData.sex || 'male';
        const ageKey = Math.min(95, Math.max(50, Math.floor(age / 5) * 5));

        let lifeExp = baseLifeExpectancy[sex]?.[ageKey] || 15;

        // Adjust for comorbidities (multiplicative factors based on literature)

        // Heart failure - significant reduction
        if (patientData.ef && patientData.ef < 40) {
            lifeExp *= 0.5; // HFrEF roughly halves life expectancy
        } else if (patientData.chfHistory) {
            lifeExp *= 0.7;
        }

        // CKD
        if (calculatedRisks.egfr) {
            const egfr = calculatedRisks.egfr.egfr;
            if (egfr < 30) lifeExp *= 0.5;
            else if (egfr < 45) lifeExp *= 0.7;
            else if (egfr < 60) lifeExp *= 0.85;
        }

        // Active cancer
        if (patientData.cancer) {
            lifeExp *= 0.4; // Highly variable, but significant reduction on average
        }

        // Frailty
        if (patientData.frailty) {
            lifeExp *= 0.6;
        }

        // Dementia
        if (patientData.dementia) {
            lifeExp *= 0.5;
        }

        // COPD
        if (patientData.copd) {
            lifeExp *= 0.8;
        }

        // Prior CV events
        if (patientData.priorMI || patientData.priorStroke) {
            lifeExp *= 0.85;
        }

        // Diabetes
        if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') {
            lifeExp *= 0.9;
        }

        return Math.max(lifeExp, 0.5); // Minimum 6 months
    },

    /**
     * Get competing risk adjustment factor
     * Reduces benefit for medications with long time-to-benefit in patients with limited life expectancy
     * @param {number} trialTimeframe - Years over which benefit was demonstrated in trial
     * @param {number} lifeExpectancy - Estimated remaining years of life
     * @param {number} userTimeHorizon - User's selected time horizon for thinking about benefits
     */
    getCompetingRiskFactor: function(trialTimeframe, lifeExpectancy, userTimeHorizon) {
        // If life expectancy is shorter than trial timeframe, reduce benefit proportionally
        // Also consider user's selected time horizon

        const effectiveHorizon = Math.min(lifeExpectancy, userTimeHorizon || 10);

        if (effectiveHorizon >= trialTimeframe) {
            // Patient likely to live long enough to realize full benefit
            return 1.0;
        } else if (effectiveHorizon <= 1) {
            // Very limited life expectancy - minimal benefit from prevention
            return 0.2;
        } else {
            // Proportional reduction - assume benefit accrues linearly over trial period
            // (This is a simplification; some benefits are front-loaded, others back-loaded)
            return effectiveHorizon / trialTimeframe;
        }
    },

    /**
     * Get adjustment factor for patient characteristics (uses competing risk)
     */
    getPatientAdjustmentFactor: function(patientData, medication, calculatedRisks = {}, preferences = {}) {
        let factor = 1.0;

        // Reduce benefit if dementia (adherence concerns)
        if (patientData.dementia) {
            factor *= 0.7;
        }

        // Note: Competing risk adjustment is now applied per-outcome in calculateNetBenefit
        // based on trial timeframe and life expectancy

        return factor;
    },

    /**
     * Adjust NNH based on patient characteristics and risk calculators
     * Lower NNH = higher risk of harm
     */
    adjustNnhForPatient: function(baseNnh, harmType, patientData, calculatedRisks = {}) {
        let adjustedNnh = baseNnh;

        // Hyperkalemia - use eGFR to adjust risk
        if (harmType.includes('hyperkalemia')) {
            if (calculatedRisks.egfr) {
                const egfr = calculatedRisks.egfr.egfr;
                if (egfr < 30) adjustedNnh *= 0.3;      // Very high risk
                else if (egfr < 45) adjustedNnh *= 0.5; // High risk
                else if (egfr < 60) adjustedNnh *= 0.7; // Moderate risk
            }
            if (patientData.diabetesStatus) adjustedNnh *= 0.8;
        }

        // AKI - use eGFR
        if (harmType === 'aki') {
            if (calculatedRisks.egfr) {
                const egfr = calculatedRisks.egfr.egfr;
                if (egfr < 30) adjustedNnh *= 0.4;
                else if (egfr < 45) adjustedNnh *= 0.6;
            }
        }

        // Hypoglycemia - age and renal function
        if (harmType.includes('hypoglycemia')) {
            if (patientData.age >= 75) adjustedNnh *= 0.6;
            if (calculatedRisks.egfr && calculatedRisks.egfr.egfr < 45) adjustedNnh *= 0.7;
        }

        // New onset diabetes from statins - baseline glucose matters
        if (harmType === 'new_onset_diabetes') {
            if (patientData.a1c && patientData.a1c >= 5.7 && patientData.a1c < 6.5) {
                adjustedNnh *= 0.5; // Prediabetes - much higher risk
            }
        }

        return Math.max(adjustedNnh, 5); // NNH can't go below 5 (20% annual risk cap)
    },

    /**
     * Check for Beers Criteria and elderly safety concerns
     * Returns warnings and cautions for medications that may be inappropriate in elderly/frail patients
     *
     * Based on AGS Beers Criteria 2023 Update
     *
     * @param {object} medication - Medication from database
     * @param {object} patientData - Patient characteristics including age, frailty, etc.
     * @returns {object} { beersWarning, elderlyCaution }
     */
    checkElderlySafety: function(medication, patientData) {
        const result = {
            beersWarning: null,
            elderlyCaution: null
        };

        const age = patientData.age || 65;
        const isElderly = age >= 65;
        const isVeryElderly = age >= 75;
        const isFrail = patientData.frailty || false;
        const hasFallRisk = patientData.fallRisk || false;
        const hasCognitiveImpairment = patientData.dementia || false;
        const hasHeartFailure = patientData.chfHistory || (patientData.ef && patientData.ef < 50);

        // Check if medication has Beers Criteria information
        if (medication.beers_criteria && medication.beers_criteria.listed) {
            const beers = medication.beers_criteria;

            // Apply Beers warning for elderly patients
            if (isElderly) {
                result.beersWarning = {
                    listed: true,
                    concern: beers.concern,
                    recommendation: beers.recommendation,
                    strength: beers.strength,
                    qualityOfEvidence: beers.quality_of_evidence,
                    severity: beers.strength === 'strong' ? 'high' : 'moderate'
                };
            }
        }

        // Check elderly_caution flags
        if (medication.elderly_caution) {
            const caution = medication.elderly_caution;
            const warnings = [];

            // Fall risk medications
            if (caution.fall_risk && (isElderly || hasFallRisk)) {
                warnings.push({
                    type: 'fall_risk',
                    message: 'Increases fall risk',
                    applies: true,
                    severity: (isVeryElderly || hasFallRisk || isFrail) ? 'high' : 'moderate'
                });
            }

            // Cognitive impairment
            if (caution.cognitive_impairment && (isElderly || hasCognitiveImpairment)) {
                warnings.push({
                    type: 'cognitive',
                    message: 'May cause or worsen cognitive impairment',
                    applies: true,
                    severity: hasCognitiveImpairment ? 'high' : 'moderate'
                });
            }

            // Sedation
            if (caution.sedation && isElderly) {
                warnings.push({
                    type: 'sedation',
                    message: 'Causes sedation and CNS depression',
                    applies: true,
                    severity: (isVeryElderly || isFrail) ? 'high' : 'moderate'
                });
            }

            // Hypoglycemia risk
            if (caution.hypoglycemia_risk && isElderly) {
                warnings.push({
                    type: 'hypoglycemia',
                    message: 'High risk of severe hypoglycemia in elderly',
                    applies: true,
                    severity: (isVeryElderly || isFrail || hasCognitiveImpairment) ? 'high' : 'moderate'
                });
            }

            // Heart failure exacerbation
            if (caution.avoid_in_hf && hasHeartFailure) {
                warnings.push({
                    type: 'heart_failure',
                    message: 'May worsen heart failure (causes edema)',
                    applies: true,
                    severity: 'high'
                });
            }

            // Narrow therapeutic window
            if (caution.narrow_therapeutic_window && isElderly) {
                warnings.push({
                    type: 'toxicity',
                    message: 'Narrow therapeutic window - high toxicity risk in elderly',
                    applies: true,
                    severity: 'high'
                });
            }

            // Frailty-specific warnings
            if (caution.avoid_if_frail && isFrail) {
                warnings.push({
                    type: 'frailty',
                    message: 'Avoid in frail patients - high risk of adverse events',
                    applies: true,
                    severity: 'high'
                });
            }

            // Compile elderly caution result
            if (warnings.length > 0) {
                const highSeverityCount = warnings.filter(w => w.severity === 'high').length;
                result.elderlyCaution = {
                    hasWarnings: true,
                    warnings: warnings,
                    overallSeverity: highSeverityCount > 0 ? 'high' : 'moderate',
                    preferAlternatives: caution.prefer_alternatives || null,
                    requiresRenalAdjustment: caution.requires_renal_adjustment || false,
                    avoidRecommended: isFrail && caution.avoid_if_frail
                };
            }
        }

        return result;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BenefitEngine;
}
