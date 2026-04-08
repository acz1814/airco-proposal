import { useState, useEffect } from 'react';
import * as estimateStorage from '../utils/estimateStorage';
import { formatCurrency } from '../utils/formatters';

export default function EnergyCalculator({ selectedSystemSeer, onSavingsCalculated }) {
  const saved = estimateStorage.getJSON('energy_calculator', {}) || {};

  const [expanded, setExpanded] = useState(saved.expanded !== false);
  const [currentSeer, setCurrentSeer] = useState(saved.currentSeer ?? 10);
  const [squareFootage, setSquareFootage] = useState(saved.squareFootage ?? 1800);
  const [coolingHours, setCoolingHours] = useState(saved.coolingHours ?? 1400);
  const [electricityRate, setElectricityRate] = useState(saved.electricityRate ?? 0.13);

  const newSeer = parseFloat(selectedSystemSeer) || 0;
  const curSeer = parseFloat(currentSeer) || 0;
  const sqft = parseFloat(squareFootage) || 0;
  const hours = parseFloat(coolingHours) || 0;
  const rate = parseFloat(electricityRate) || 0;

  const btu = sqft * 20;
  const currentAnnualKwh = curSeer > 0 ? (btu * hours) / (curSeer * 1000) : 0;
  const newAnnualKwh = newSeer > 0 ? (btu * hours) / (newSeer * 1000) : 0;
  const annualKwhSaved = currentAnnualKwh - newAnnualKwh;
  const annualSavings = annualKwhSaved * rate;
  const monthlySavings = annualSavings / 12;
  const fiveYear = annualSavings * 5;
  const tenYear = annualSavings * 10;
  const efficiencyImprovement =
    curSeer > 0 ? ((newSeer - curSeer) / curSeer) * 100 : 0;

  useEffect(() => {
    estimateStorage.setItem('energy_calculator', JSON.stringify({
      currentSeer, squareFootage, coolingHours, electricityRate, expanded,
    }));
  }, [currentSeer, squareFootage, coolingHours, electricityRate, expanded]);

  useEffect(() => {
    if (typeof onSavingsCalculated === 'function') {
      onSavingsCalculated(annualSavings);
    }
  }, [annualSavings, onSavingsCalculated]);

  const fmtKwh = (n) => Math.round(n).toLocaleString();
  const fmt0 = (n) => formatCurrency(Math.round(n));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-gray-900">⚡ Calculate My Energy Savings</span>
        <span className="text-gray-500 text-xl">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-500 mb-4">
            Based on standard HVAC efficiency formulas and your inputs. Actual savings may vary.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current System SEER</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={currentSeer}
                onChange={e => setCurrentSeer(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New System SEER</label>
              <input
                type="number"
                value={newSeer || ''}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Square Footage</label>
              <input
                type="number"
                min="0"
                value={squareFootage}
                onChange={e => setSquareFootage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Electricity Cost ($/kWh)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={electricityRate}
                onChange={e => setElectricityRate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Cooling Hours Per Year: <span className="font-semibold">{coolingHours}</span>
              </label>
              <input
                type="range"
                min="800"
                max="3000"
                step="50"
                value={coolingHours}
                onChange={e => setCoolingHours(e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>800</span>
                <span>3000</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Estimated Monthly Savings</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{fmt0(monthlySavings)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Estimated Annual Savings</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{fmt0(annualSavings)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Current system annual usage</p>
              <p className="font-semibold">{fmtKwh(currentAnnualKwh)} kWh</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">New system annual usage</p>
              <p className="font-semibold">{fmtKwh(newAnnualKwh)} kWh</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Efficiency improvement</p>
              <p className="font-semibold">{Math.round(efficiencyImprovement)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">5-Year Savings</p>
              <p className="font-semibold">{fmt0(fiveYear)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">10-Year Savings</p>
              <p className="font-semibold">{fmt0(tenYear)}</p>
            </div>
          </div>

          <div className="bg-blue-700 text-white rounded-xl p-4 text-center font-semibold mb-3">
            This system could save you approximately {fmt0(annualSavings)}/year in energy costs
          </div>

          <p className="text-sm text-gray-700 text-center">Higher efficiency systems pay for themselves over time.</p>
          <p className="text-sm text-gray-600 text-center mt-1">
            Ask your technician about financing options that cost less than your monthly savings.
          </p>
        </div>
      )}
    </div>
  );
}
