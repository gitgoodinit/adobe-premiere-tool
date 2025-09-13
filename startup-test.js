// ========================================
// STARTUP TEST FOR PRECISE TIMING FEATURE
// ========================================

// Test that all components load properly on startup
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting application with precise timing feature...');
    
    // Test 1: Check if AudioToolsPro class exists
    if (typeof AudioToolsPro !== 'undefined') {
        console.log('✅ AudioToolsPro class loaded');
    } else {
        console.error('❌ AudioToolsPro class not found');
        return;
    }
    
    // Test 2: Check if precise timing methods exist
    const testInstance = new AudioToolsPro();
    const requiredMethods = [
        'initializePreciseTimingScheduler',
        'applyPreciseTimingCorrections',
        'runPreciseTimingTests',
        'displayTimingStats'
    ];
    
    let methodsOK = true;
    requiredMethods.forEach(method => {
        if (typeof testInstance[method] === 'function') {
            console.log(`✅ Method ${method} available`);
        } else {
            console.error(`❌ Method ${method} missing`);
            methodsOK = false;
        }
    });
    
    // Test 3: Check if UI elements exist
    const requiredElements = [
        'timingStatsPanel',
        'timingStats', 
        'enablePreciseTiming',
        'enableTimingValidation'
    ];
    
    let elementsOK = true;
    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`✅ UI element ${elementId} found`);
        } else {
            console.error(`❌ UI element ${elementId} missing`);
            elementsOK = false;
        }
    });
    
    // Final status
    if (methodsOK && elementsOK) {
        console.log('🎉 All precise timing components loaded successfully!');
        
        // Show success message in UI if available
        setTimeout(() => {
            if (window.audioToolsPro && window.audioToolsPro.showUIMessage) {
                window.audioToolsPro.showUIMessage('✅ Precise timing feature ready', 'success');
            }
        }, 1000);
    } else {
        console.error('❌ Some components failed to load properly');
    }
});

// Error handler for any uncaught errors
window.addEventListener('error', function(event) {
    console.error('🚨 JavaScript Error:', event.error);
    console.error('   File:', event.filename, 'Line:', event.lineno);
    
    // Show error in UI if available
    if (window.audioToolsPro && window.audioToolsPro.showUIMessage) {
        window.audioToolsPro.showUIMessage(`❌ Error: ${event.error.message}`, 'error');
    }
});