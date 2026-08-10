# Plan to Fill Medication Database with Evidence-Based Data

## Data Sources

### Primary Sources
1. **SPARCtool** (sparctool.com) - Stroke Prevention in Atrial Fibrillation Risk Tool
   - CHA2DS2-VASc and HAS-BLED risk calculations
   - Comparative data for anticoagulants: warfarin, apixaban, rivaroxaban, dabigatran, edoxaban
   - Net clinical benefit calculations (strokes prevented per major bleed caused)

2. **TheNNT** (thennt.com) - NNT Database
   - Evidence-based NNT/NNH values
   - Color-coded benefit ratings (green, yellow, red, black)
   - Covers cardiovascular, diabetes, and many other categories

3. **Landmark Clinical Trials**
   - CONSENSUS, SOLVD (ACE inhibitors in HF)
   - COPERNICUS, MERIT-HF (Beta-blockers in HF)
   - PARADIGM-HF (Sacubitril/valsartan)
   - EMPA-REG, DAPA-HF, EMPEROR trials (SGLT2 inhibitors)
   - UKPDS (Metformin in diabetes)
   - ARISTOTLE, RE-LY, ROCKET-AF (DOACs vs warfarin)

---

## Medication Categories to Include

### 1. Heart Failure Medications (HFrEF)

| Medication | Trial | RRR Mortality | NNT | Timeframe |
|------------|-------|---------------|-----|-----------|
| **Carvedilol** | COPERNICUS | 35% | 9 | 3 years |
| **Metoprolol XL** | MERIT-HF | 34% | 27 | 1 year |
| **Bisoprolol** | CIBIS-II | 34% | 23 | 1.3 years |
| **Enalapril** | CONSENSUS | 40% | 6 | 6 months (NYHA IV) |
| **Enalapril** | SOLVD | 16% | 22 | 3.5 years |
| **Sacubitril/Valsartan** | PARADIGM-HF | 16% | 21 | 2.3 years |
| **Spironolactone** | RALES | 30% | 9 | 2 years |
| **Eplerenone** | EMPHASIS-HF | 24% | 19 | 1.8 years |
| **Empagliflozin** | EMPEROR-Reduced | 17% | ~45 | 1.3 years |
| **Dapagliflozin** | DAPA-HF | 17% | ~45 | 1.5 years |

**Composite (CV death + HF hospitalization):**
- SGLT2i: NNT 17-19 over ~1.5 years
- ARNI: NNT 21 over 2.3 years

---

### 2. Anticoagulants for Atrial Fibrillation

| Medication | vs Control | RRR Stroke | RRR Major Bleeding |
|------------|------------|------------|-------------------|
| **Warfarin** | Placebo | 64% | N/A (increases) |
| **Apixaban** | Warfarin | 21% | 31% less bleeding |
| **Rivaroxaban** | Warfarin | Non-inferior | Similar bleeding |
| **Dabigatran 150** | Warfarin | 34% | Similar bleeding |
| **Dabigatran 110** | Warfarin | Non-inferior | 20% less bleeding |
| **Edoxaban** | Warfarin | Non-inferior | 20% less bleeding |

**NNT depends on baseline stroke risk (CHA2DS2-VASc):**
- CHA2DS2-VASc 2: NNT ~125/year for stroke prevention
- CHA2DS2-VASc 4: NNT ~50/year
- CHA2DS2-VASc 6: NNT ~25/year

---

### 3. Statins

| Indication | RRR MACE | NNT 5-year | Notes |
|------------|----------|------------|-------|
| **Secondary Prevention** | 25% | 25-39 | Clear benefit |
| **Primary - High Risk (>20%)** | 25% | 25-50 | Recommended |
| **Primary - Intermediate (7.5-20%)** | 25% | 50-100 | Consider |
| **Primary - Low Risk (<7.5%)** | 25% | 200-400 | Limited benefit |

**Harms:**
- Myalgia: 10% (RRI 1.1)
- New diabetes: 1% (RRI 1.1)
- Rhabdomyolysis: 0.01% (rare but severe)

---

### 4. Diabetes Medications

| Medication | Mortality RRR | NNT | Key Outcomes |
|------------|---------------|-----|--------------|
| **Metformin** | 36% | 14 (10yr) | UKPDS - all-cause mortality |
| **Empagliflozin** | 32% | 39 (3yr) | CV mortality (EMPA-REG) |
| **Liraglutide** | 15% | 67 (3.8yr) | All-cause mortality (LEADER) |
| **Semaglutide** | 26% NS | - | MACE reduction (SUSTAIN-6) |
| **Glipizide** | 0% | None | No CV benefit, hypoglycemia risk |
| **Sitagliptin** | 0% | None | CV neutral |
| **Pioglitazone** | 0% (MACE -16%) | - | Increased HF risk |

---

### 5. Antiplatelet Therapy

| Indication | Medication | RRR MACE | NNT | NNH Bleeding |
|------------|------------|----------|-----|--------------|
| **Secondary Prevention** | Aspirin | 20% | 50 | 100 |
| **Primary Prevention** | Aspirin | 11% | 250 | 200 |
| **Post-ACS** | DAPT | 20% | 50 | 70 |

---

### 6. Blood Pressure Medications

| Class | RRR Stroke | RRR MI | Notes |
|-------|------------|--------|-------|
| **Thiazides** | 29% | 21% | Preferred first-line |
| **ACE Inhibitors** | 30% | 20% | Diabetes, CKD benefit |
| **ARBs** | Similar to ACEi | Similar | Better tolerated |
| **CCBs** | 38% | 18% | Elderly, ISH |
| **Beta-blockers** | 19% | Variable | Not first-line |

---

## Harm Data to Include

### Bleeding (for anticoagulants)
- Major bleeding: 2-3%/year on warfarin
- Intracranial bleeding: 0.3-0.5%/year on warfarin, 0.15-0.3% on DOACs
- GI bleeding: 1-2%/year

### Hypoglycemia (for diabetes meds)
- Severe hypoglycemia (sulfonylureas): 1-2%/year
- Hypoglycemia (insulin): 15-30%/year
- Minimal with metformin, SGLT2i, GLP-1

### Other Key Harms
- Hyperkalemia (MRA, ACEi/ARB): 3-8%
- Hypotension (HF meds): 5-15%
- Renal worsening (ACEi, SGLT2i initial): 5-10%
- Genital infections (SGLT2i): 5-10%

---

## Burden Classification

### Low Burden
- Once daily, no monitoring: statins, aspirin, thiazides, CCBs, most DOACs

### Moderate Burden
- Twice daily, some monitoring: beta-blockers, ACEi/ARB, metformin, spironolactone

### High Burden
- Frequent monitoring, injections, dietary restrictions: warfarin, insulin, injectable GLP-1

---

## Implementation Plan

### Phase 1: Core 10 Medications (Current)
Already implemented with reasonable estimates:
1. Carvedilol
2. Empagliflozin
3. Spironolactone
4. Atorvastatin
5. Apixaban
6. Metformin
7. Glipizide
8. Aspirin
9. Sacubitril/valsartan
10. Warfarin

### Phase 2: Expand to 30 Medications
Add:
- Lisinopril, Losartan (ACEi/ARB)
- Metoprolol, Bisoprolol (beta-blockers)
- Amlodipine, Hydrochlorothiazide (BP)
- Rosuvastatin (statin)
- Rivaroxaban, Dabigatran, Edoxaban (DOACs)
- Dapagliflozin, Canagliflozin (SGLT2i)
- Liraglutide, Semaglutide (GLP-1)
- Sitagliptin (DPP-4)
- Eplerenone (MRA)
- Digoxin (rate control)
- Clopidogrel (antiplatelet)

### Phase 3: Comprehensive Database (50+ medications)
- Add remaining common medications
- Include specialty medications (oncology, rheumatology)
- Add drug interactions
- Add contraindication checking

---

## Key References

1. **SPARCtool**: https://sparctool.com/
2. **TheNNT**: https://thennt.com/
3. **ACC/AHA Guidelines**: https://www.acc.org/guidelines
4. **ESC Guidelines**: https://www.escardio.org/guidelines
5. **Wiki Journal Club**: https://www.wikijournalclub.org/

### Landmark Trials
- CONSENSUS (NEJM 1987)
- SOLVD (NEJM 1991)
- MERIT-HF (Lancet 1999)
- COPERNICUS (NEJM 2001)
- RALES (NEJM 1999)
- PARADIGM-HF (NEJM 2014)
- EMPA-REG OUTCOME (NEJM 2015)
- DAPA-HF (NEJM 2019)
- ARISTOTLE (NEJM 2011)
- UKPDS 34 (Lancet 1998)
