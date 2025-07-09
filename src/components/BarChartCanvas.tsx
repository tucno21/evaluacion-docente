import React, { useRef, useEffect, useState } from 'react';
import type { AchievementLevel } from '../types/types';

interface StackedBarChartData {
    label: string; // Criterion name
    levels: { level: AchievementLevel | ''; count: number; percentage: number; color: string }[];
}

interface BarChartCanvasProps {
    data: StackedBarChartData[];
    // Removed width and height from props to manage them internally for responsiveness
}

const BarChartCanvas: React.FC<BarChartCanvasProps> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the parent container

    const [canvasWidth, setCanvasWidth] = useState(600);
    const [canvasHeight, setCanvasHeight] = useState(300);

    useEffect(() => {
        const updateCanvasDimensions = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                let newWidth = 600; // Default for larger screens
                let newHeight = 300;

                if (containerWidth < 640) { // Mobile breakpoint (e.g., Tailwind's 'sm' is 640px)
                    newWidth = containerWidth - 20; // Small padding
                    newHeight = 250;
                } else if (containerWidth < 768) { // Tablet breakpoint (e.g., Tailwind's 'md' is 768px)
                    newWidth = containerWidth - 40; // Medium padding
                    newHeight = 280;
                } else {
                    newWidth = 600;
                    newHeight = 300;
                }
                setCanvasWidth(newWidth);
                setCanvasHeight(newHeight);
            }
        };

        // Set initial dimensions
        updateCanvasDimensions();

        // Add event listener for window resize
        window.addEventListener('resize', updateCanvasDimensions);

        // Cleanup event listener on component unmount
        return () => window.removeEventListener('resize', updateCanvasDimensions);
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas before drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 40; // Increased padding for labels and axis
        const chartWidth = canvasWidth - 2 * padding;
        const chartHeight = canvasHeight - 2 * padding;

        const isDarkMode = document.documentElement.classList.contains('dark');

        // Handle case where data is empty to prevent division by zero
        if (data.length === 0) {
            ctx.fillStyle = isDarkMode ? '#999' : '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos para mostrar el gráfico.', canvasWidth / 2, canvasHeight / 2);
            return;
        }

        const barGroupWidth = chartWidth / data.length;
        const barSpacing = barGroupWidth * 0.2; // Space between bar groups
        const actualBarWidth = barGroupWidth - barSpacing;

        const maxPercentage = 100; // Y-axis max is always 100%
        const scaleY = chartHeight / maxPercentage;

        // Draw Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvasHeight - padding);
        ctx.strokeStyle = isDarkMode ? '#555' : '#666';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw X-axis
        ctx.beginPath();
        ctx.moveTo(padding, canvasHeight - padding);
        ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
        ctx.strokeStyle = isDarkMode ? '#555' : '#666';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Y-axis labels (percentages)
        ctx.fillStyle = isDarkMode ? '#ccc' : '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        const numTicks = 5; // 0%, 25%, 50%, 75%, 100%
        for (let i = 0; i <= numTicks; i++) {
            const value = (maxPercentage / numTicks) * i;
            const y = canvasHeight - padding - (value * scaleY);
            ctx.fillText(`${value}%`, padding - 5, y + 3);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + 5, y);
            ctx.strokeStyle = isDarkMode ? '#444' : '#ccc';
            ctx.stroke();
        }

        // Draw stacked bars
        data.forEach((criterionData, index) => {
            const x = padding + index * barGroupWidth + barSpacing / 2;
            let currentY = canvasHeight - padding; // Start from the bottom of the chart

            // Draw criterion label below X-axis with rotation for long labels
            ctx.save(); // Save the current canvas state
            ctx.fillStyle = isDarkMode ? '#ccc' : '#333';
            ctx.font = '10px Arial'; // Smaller font for rotated labels
            ctx.textAlign = 'right'; // Align text to the right for rotation
            ctx.translate(x + actualBarWidth / 2, canvasHeight - padding + 5); // Translate to the pivot point
            ctx.rotate(-Math.PI / 4); // Rotate by -45 degrees

            const labelText = criterionData.label.length > 7 ? criterionData.label.substring(0, 10) + '...' : criterionData.label;
            ctx.fillText(labelText, 0, 0); // Draw text at the translated and rotated origin

            ctx.restore(); // Restore the canvas state

            criterionData.levels.forEach(levelData => {
                const barHeight = levelData.percentage * scaleY;
                ctx.fillStyle = levelData.color;
                ctx.fillRect(x, currentY - barHeight, actualBarWidth, barHeight);

                // Draw percentage label on top of each segment if percentage > 0
                if (levelData.percentage > 0) {
                    ctx.fillStyle = (levelData.color === '#ffffff') ? '#333' : '#fff'; // Black text for white segments
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.round(levelData.percentage)}%`, x + actualBarWidth / 2, currentY - barHeight / 2 + 4);
                }

                currentY -= barHeight; // Move currentY up for the next segment
            });
        });

    }, [data, canvasWidth, canvasHeight]); // Depend on canvas dimensions

    return (
        <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }}>
            <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-dark-bg-card block mx-auto">
                Your browser does not support the HTML canvas tag.
            </canvas>
        </div>
    );
};

export default BarChartCanvas;
