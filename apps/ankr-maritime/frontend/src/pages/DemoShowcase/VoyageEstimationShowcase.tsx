import { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

export default function VoyageEstimationShowcase() {
  // Interactive state
  const [bunkerPrice, setBunkerPrice] = useState(620); // $/mt
  const [speed, setSpeed] = useState(11.6); // knots
  const [freightRate, setFreightRate] = useState(45); // $/mt

  // Fixed voyage parameters
  const distance = 2847; // nautical miles
  const cargoQuantity = 32000; // mt
  const portCosts = 125000; // $
  const canalCost = 450000; // $ (Suez)
  const otherCosts = 148000; // $

  // Calculate voyage metrics
  const calculations = useMemo(() => {
    // Time at sea (days) = distance / (speed * 24)
    const voyageDays = distance / (speed * 24);

    // Fuel consumption (simplified: 30 mt/day base, adjusted for speed)
    const speedFactor = Math.pow(speed / 12, 3); // Cubic relationship
    const dailyConsumption = 24 * speedFactor;
    const totalBunker = dailyConsumption * voyageDays;
    const bunkerCost = totalBunker * bunkerPrice;

    // Revenue
    const revenue = cargoQuantity * freightRate;

    // Total costs
    const totalCosts = bunkerCost + portCosts + canalCost + otherCosts;

    // Profit
    const profit = revenue - totalCosts;
    const margin = (profit / revenue) * 100;

    return {
      voyageDays: voyageDays.toFixed(1),
      totalBunker: totalBunker.toFixed(0),
      bunkerCost: bunkerCost.toFixed(0),
      revenue: revenue.toFixed(0),
      totalCosts: totalCosts.toFixed(0),
      profit: profit.toFixed(0),
      margin: margin.toFixed(1),
    };
  }, [bunkerPrice, speed, freightRate, distance, cargoQuantity, portCosts, canalCost, otherCosts]);

  return (
    <ShowcaseLayout
      title="Voyage Estimation Canvas"
      icon="💰"
      category="Voyage Planning"
      problem="Manual voyage estimation takes 2-3 hours, frequent calculation errors, no real-time market data integration, difficult to run what-if scenarios"
      solution="Automated calculation with live bunker prices, instant what-if analysis, visual route display, 95% accuracy, 5-minute estimates instead of 2 hours"
      timeSaved="2 hours → 5 minutes"
      roi="15x"
      accuracy="95%"
      nextSection={{
        title: 'Route Optimization',
        path: '/demo-showcase/route-optimization',
      }}
    >
      {/* Main Canvas */}
      <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Interactive Voyage Calculator</h2>

        {/* Route Visualization */}
        <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <div className="text-3xl mb-2">🇸🇬</div>
              <div className="text-lg font-semibold text-white">SINGAPORE</div>
              <div className="text-sm text-maritime-400">SGSIN</div>
            </div>

            <div className="flex-1 flex flex-col items-center px-8">
              <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full mb-2" />
              <div className="text-sm text-maritime-400">{distance} nautical miles</div>
              <div className="text-sm text-maritime-400">{calculations.voyageDays} days @ {speed} knots</div>
              <div className="text-sm text-maritime-400">Bunker: {calculations.totalBunker} mt @ ${bunkerPrice}/mt</div>
            </div>

            <div className="text-center flex-1">
              <div className="text-3xl mb-2">🇳🇱</div>
              <div className="text-lg font-semibold text-white">ROTTERDAM</div>
              <div className="text-sm text-maritime-400">NLRTM</div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-maritime-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-maritime-400">Revenue</span>
                <span className="text-lg font-semibold text-green-400">
                  ${parseInt(calculations.revenue).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-maritime-500 ml-2">
                {cargoQuantity.toLocaleString()} mt × ${freightRate}/mt
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-maritime-400">Total Costs</span>
                <span className="text-lg font-semibold text-red-400">
                  ${parseInt(calculations.totalCosts).toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 text-xs text-maritime-500 ml-2">
                <div className="flex justify-between">
                  <span>• Bunker:</span>
                  <span>${parseInt(calculations.bunkerCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Port Costs:</span>
                  <span>${portCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Canal (Suez):</span>
                  <span>${canalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Other:</span>
                  <span>${otherCosts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Display */}
          <div className="mt-6 pt-6 border-t border-maritime-700">
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg p-6 text-center">
              <div className="text-sm text-maritime-400 mb-2">Estimated Profit</div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                💰 ${parseInt(calculations.profit).toLocaleString()}
              </div>
              <div className="text-sm text-maritime-400">
                {calculations.margin}% margin
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">📊 What-If Analysis - Adjust & Recalculate</h3>

          {/* Bunker Price Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-maritime-300">
                Bunker Price (IFO 380)
              </label>
              <span className="text-lg font-semibold text-blue-400">
                ${bunkerPrice}/mt
              </span>
            </div>
            <input
              type="range"
              min="400"
              max="900"
              step="10"
              value={bunkerPrice}
              onChange={(e) => setBunkerPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-maritime-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-maritime-500 mt-1">
              <span>$400/mt</span>
              <span>$900/mt</span>
            </div>
          </div>

          {/* Speed Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-maritime-300">
                Vessel Speed
              </label>
              <span className="text-lg font-semibold text-cyan-400">
                {speed} knots
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="15"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-maritime-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-maritime-500 mt-1">
              <span>8 knots (eco)</span>
              <span>15 knots (fast)</span>
            </div>
          </div>

          {/* Freight Rate Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-maritime-300">
                Freight Rate
              </label>
              <span className="text-lg font-semibold text-green-400">
                ${freightRate}/mt
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="70"
              step="1"
              value={freightRate}
              onChange={(e) => setFreightRate(parseInt(e.target.value))}
              className="w-full h-2 bg-maritime-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="flex justify-between text-xs text-maritime-500 mt-1">
              <span>$30/mt</span>
              <span>$70/mt</span>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                setBunkerPrice(620);
                setSpeed(11.6);
                setFreightRate(45);
              }}
              className="px-6 py-2 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors"
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">📍</div>
          <h3 className="text-lg font-semibold text-white mb-2">Live Port Data</h3>
          <p className="text-sm text-maritime-400">
            Real-time port costs, tariffs, and restrictions integrated from 10,000+ ports worldwide
          </p>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">🌊</div>
          <h3 className="text-lg font-semibold text-white mb-2">Weather Routing</h3>
          <p className="text-sm text-maritime-400">
            Automatic weather optimization to avoid storms, reduce fuel consumption, and ensure on-time arrival
          </p>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-white mb-2">Market Integration</h3>
          <p className="text-sm text-maritime-400">
            Live bunker prices, freight rates, and market indices automatically updated every 15 minutes
          </p>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
