import React, { useState, useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AudioVolumeCurveEditor = () => {
  const [points, setPoints] = useState([
    { x: 0, y: 1 },
    { x: 25, y: 0.7 },
    { x: 50, y: 0.5 },
    { x: 75, y: 0.8 },
    { x: 100, y: 1 }
  ]);

  const chartRef = useRef(null);

  const updatePoint = (index, newY) => {
    const newPoints = [...points];
    newPoints[index].y = newY;
    setPoints(newPoints);
  };

  const addPoint = (x, y) => {
    const newPoints = [...points, { x, y }].sort((a, b) => a.x - b.x);
    setPoints(newPoints);
  };

  const removePoint = (index) => {
    if (points.length > 2) {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
    }
  };

  const data = {
    labels: points.map(p => p.x),
    datasets: [
      {
        label: 'Volume',
        data: points.map(p => p.y),
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 1
      },
      x: {
        type: 'linear',
        min: 0,
        max: 100
      }
    },
    onClick: (event, elements) => {
      if (elements.length === 0) {
        const chart = chartRef.current;
        const canvasPosition = Chart.helpers.getRelativePosition(event, chart);
        const x = chart.scales.x.getValueForPixel(canvasPosition.x);
        const y = chart.scales.y.getValueForPixel(canvasPosition.y);
        addPoint(Math.round(x), Math.max(0, Math.min(1, y)));
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `Volume: ${Math.round(context.parsed.y * 100)}%`
        }
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Audio Volume Curve Editor</h2>
      <Line ref={chartRef} data={data} options={options} />
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Control Points:</h3>
        {points.map((point, index) => (
          <div key={index} className="flex items-center mb-2">
            <span className="mr-2">Time: {point.x}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={point.y}
              onChange={(e) => updatePoint(index, parseFloat(e.target.value))}
              className="mr-2"
            />
            <span className="mr-2">Volume: {Math.round(point.y * 100)}%</span>
            {index !== 0 && index !== points.length - 1 && (
              <button
                onClick={() => removePoint(index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioVolumeCurveEditor;