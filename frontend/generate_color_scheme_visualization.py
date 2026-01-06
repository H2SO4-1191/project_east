#!/usr/bin/env python3
"""
Performance Metrics Comparison Chart Generator
Generates Figure 3.16: Performance metrics comparison (before and after optimizations)
"""

import matplotlib.pyplot as plt
import numpy as np


def generate_performance_metrics_chart():
    """Generate performance metrics comparison chart (Figure 3.16)."""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Project East: Performance Metrics Comparison (Before vs After Optimizations)', 
                 fontsize=18, fontweight='bold', y=0.98)
    
    # Performance metrics data
    metrics = {
        'Initial Load Time (3G)': {
            'before': 2.1,
            'after': 1.3,
            'unit': 'seconds',
            'improvement': 38.1
        },
        'Initial Bundle Size': {
            'before': 850,
            'after': 510,
            'unit': 'KB',
            'improvement': 40.0
        },
        'Time to Interactive': {
            'before': 3.5,
            'after': 2.2,
            'unit': 'seconds',
            'improvement': 37.1
        },
        'First Contentful Paint': {
            'before': 1.8,
            'after': 1.1,
            'unit': 'seconds',
            'improvement': 38.9
        }
    }
    
    metric_names = list(metrics.keys())
    before_values = [metrics[m]['before'] for m in metric_names]
    after_values = [metrics[m]['after'] for m in metric_names]
    improvements = [metrics[m]['improvement'] for m in metric_names]
    units = [metrics[m]['unit'] for m in metric_names]
    
    # Colors
    before_color = '#ef4444'  # Red
    after_color = '#10b981'  # Green
    improvement_color = '#2563eb'  # Blue
    
    # Chart 1: Initial Load Time (Top Left)
    ax1 = axes[0, 0]
    categories = ['Before', 'After']
    values = [before_values[0], after_values[0]]
    bars1 = ax1.bar(categories, values, color=[before_color, after_color], 
                    alpha=0.8, edgecolor='black', linewidth=1.5)
    ax1.set_ylabel(f'Load Time ({units[0]})', fontsize=11, fontweight='bold')
    ax1.set_title('Initial Load Time (3G Connection)', 
                  fontsize=12, fontweight='bold', pad=15)
    ax1.grid(axis='y', alpha=0.3, linestyle='--')
    ax1.set_ylim(0, max(before_values[0], after_values[0]) * 1.3)
    
    # Add value labels
    for i, (bar, val) in enumerate(zip(bars1, values)):
        ax1.text(bar.get_x() + bar.get_width()/2., val,
                f'{val} {units[0]}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    # Add improvement annotation
    ax1.annotate(f'↓ {improvements[0]:.1f}%', 
                xy=(1, after_values[0]), xytext=(0.5, max(values) * 0.7),
                arrowprops=dict(arrowstyle='->', color=improvement_color, lw=2),
                fontsize=11, fontweight='bold', color=improvement_color,
                bbox=dict(boxstyle='round,pad=0.5', facecolor='white', 
                         edgecolor=improvement_color, linewidth=2))
    
    # Chart 2: Bundle Size (Top Right)
    ax2 = axes[0, 1]
    values2 = [before_values[1], after_values[1]]
    bars2 = ax2.bar(categories, values2, color=[before_color, after_color], 
                    alpha=0.8, edgecolor='black', linewidth=1.5)
    ax2.set_ylabel(f'Size ({units[1]})', fontsize=11, fontweight='bold')
    ax2.set_title('Initial Bundle Size', 
                  fontsize=12, fontweight='bold', pad=15)
    ax2.grid(axis='y', alpha=0.3, linestyle='--')
    ax2.set_ylim(0, max(before_values[1], after_values[1]) * 1.3)
    
    # Add value labels
    for i, (bar, val) in enumerate(zip(bars2, values2)):
        ax2.text(bar.get_x() + bar.get_width()/2., val,
                f'{val} {units[1]}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    # Add improvement annotation
    ax2.annotate(f'↓ {improvements[1]:.1f}%', 
                xy=(1, after_values[1]), xytext=(0.5, max(values2) * 0.7),
                arrowprops=dict(arrowstyle='->', color=improvement_color, lw=2),
                fontsize=11, fontweight='bold', color=improvement_color,
                bbox=dict(boxstyle='round,pad=0.5', facecolor='white', 
                         edgecolor=improvement_color, linewidth=2))
    
    # Chart 3: Time to Interactive (Bottom Left)
    ax3 = axes[1, 0]
    values3 = [before_values[2], after_values[2]]
    bars3 = ax3.bar(categories, values3, color=[before_color, after_color], 
                    alpha=0.8, edgecolor='black', linewidth=1.5)
    ax3.set_ylabel(f'Time ({units[2]})', fontsize=11, fontweight='bold')
    ax3.set_title('Time to Interactive', 
                  fontsize=12, fontweight='bold', pad=15)
    ax3.grid(axis='y', alpha=0.3, linestyle='--')
    ax3.set_ylim(0, max(before_values[2], after_values[2]) * 1.3)
    
    # Add value labels
    for i, (bar, val) in enumerate(zip(bars3, values3)):
        ax3.text(bar.get_x() + bar.get_width()/2., val,
                f'{val} {units[2]}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    # Add improvement annotation
    ax3.annotate(f'↓ {improvements[2]:.1f}%', 
                xy=(1, after_values[2]), xytext=(0.5, max(values3) * 0.7),
                arrowprops=dict(arrowstyle='->', color=improvement_color, lw=2),
                fontsize=11, fontweight='bold', color=improvement_color,
                bbox=dict(boxstyle='round,pad=0.5', facecolor='white', 
                         edgecolor=improvement_color, linewidth=2))
    
    # Chart 4: First Contentful Paint (Bottom Right)
    ax4 = axes[1, 1]
    values4 = [before_values[3], after_values[3]]
    bars4 = ax4.bar(categories, values4, color=[before_color, after_color], 
                    alpha=0.8, edgecolor='black', linewidth=1.5)
    ax4.set_ylabel(f'Time ({units[3]})', fontsize=11, fontweight='bold')
    ax4.set_title('First Contentful Paint', 
                  fontsize=12, fontweight='bold', pad=15)
    ax4.grid(axis='y', alpha=0.3, linestyle='--')
    ax4.set_ylim(0, max(before_values[3], after_values[3]) * 1.3)
    
    # Add value labels
    for i, (bar, val) in enumerate(zip(bars4, values4)):
        ax4.text(bar.get_x() + bar.get_width()/2., val,
                f'{val} {units[3]}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    # Add improvement annotation
    ax4.annotate(f'↓ {improvements[3]:.1f}%', 
                xy=(1, after_values[3]), xytext=(0.5, max(values4) * 0.7),
                arrowprops=dict(arrowstyle='->', color=improvement_color, lw=2),
                fontsize=11, fontweight='bold', color=improvement_color,
                bbox=dict(boxstyle='round,pad=0.5', facecolor='white', 
                         edgecolor=improvement_color, linewidth=2))
    
    # Add summary text at bottom
    avg_improvement = np.mean(improvements)
    summary_text = f"""
    Optimization Summary:
    • Average Improvement: {avg_improvement:.1f}%
    • Key Optimization: Vite code splitting (route-based)
    • Measurement Method: Chrome DevTools network throttling (3G) + Lighthouse audits
    • Impact: Faster initial load, better user experience, reduced bandwidth usage
    """
    
    fig.text(0.5, 0.02, summary_text, ha='center', va='bottom', 
            fontsize=10, bbox=dict(boxstyle='round', facecolor='lightblue', 
                                  alpha=0.8, pad=10))
    
    plt.tight_layout(rect=[0, 0.08, 1, 0.96])
    return fig


def main():
    """Main function to generate the performance metrics chart."""
    print("Generating Figure 3.16: Performance metrics comparison...")
    fig = generate_performance_metrics_chart()
    output_path = 'performance_metrics_comparison.png'
    fig.savefig(output_path, dpi=300, bbox_inches='tight', 
                 facecolor='white', edgecolor='none')
    print(f"[OK] Saved: {output_path}")
    print("Figure 3.16: Performance metrics comparison (before and after optimizations)")


if __name__ == '__main__':
    main()
