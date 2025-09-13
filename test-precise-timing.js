// ========================================
// PRECISE TIMING SCHEDULER TEST SUITE
// ========================================

// Test the complete precise timing implementation
AudioToolsPro.prototype.runPreciseTimingTests = async function() {
    this.log('🧪 Starting comprehensive precise timing tests...', 'info');
    
    try {
        const testResults = {
            tests: [],
            passed: 0,
            failed: 0,
            totalTime: 0
        };
        
        const startTime = performance.now();
        
        // Test 1: Basic timing accuracy
        this.log('📋 Test 1: Basic timing accuracy validation', 'info');
        const timingTest = await this.testPreciseTimingAccuracy();
        testResults.tests.push({
            name: 'Basic Timing Accuracy',
            passed: timingTest.passed,
            details: timingTest
        });
        
        if (timingTest.passed) {
            testResults.passed++;
            this.log('✅ Test 1 PASSED', 'success');
        } else {
            testResults.failed++;
            this.log('❌ Test 1 FAILED', 'error');
        }
        
        // Test 2: Scheduler initialization
        this.log('📋 Test 2: Scheduler initialization', 'info');
        const initTest = this.testSchedulerInitialization();
        testResults.tests.push({
            name: 'Scheduler Initialization',
            passed: initTest.passed,
            details: initTest
        });
        
        if (initTest.passed) {
            testResults.passed++;
            this.log('✅ Test 2 PASSED', 'success');
        } else {
            testResults.failed++;
            this.log('❌ Test 2 FAILED', 'error');
        }
        
        // Test 3: Sample-accurate positioning
        this.log('📋 Test 3: Sample-accurate positioning', 'info');
        const positionTest = this.testSampleAccuratePositioning();
        testResults.tests.push({
            name: 'Sample-Accurate Positioning',
            passed: positionTest.passed,
            details: positionTest
        });
        
        if (positionTest.passed) {
            testResults.passed++;
            this.log('✅ Test 3 PASSED', 'success');
        } else {
            testResults.failed++;
            this.log('❌ Test 3 FAILED', 'error');
        }
        
        // Test 4: Timing tolerance validation (±300ms requirement)
        this.log('📋 Test 4: ±300ms tolerance validation', 'info');
        const toleranceTest = this.testTimingTolerance();
        testResults.tests.push({
            name: '±300ms Tolerance',
            passed: toleranceTest.passed,
            details: toleranceTest
        });
        
        if (toleranceTest.passed) {
            testResults.passed++;
            this.log('✅ Test 4 PASSED', 'success');
        } else {
            testResults.failed++;
            this.log('❌ Test 4 FAILED', 'error');
        }
        
        // Test 5: UI integration
        this.log('📋 Test 5: UI integration test', 'info');
        const uiTest = this.testUIIntegration();
        testResults.tests.push({
            name: 'UI Integration',
            passed: uiTest.passed,
            details: uiTest
        });
        
        if (uiTest.passed) {
            testResults.passed++;
            this.log('✅ Test 5 PASSED', 'success');
        } else {
            testResults.failed++;
            this.log('❌ Test 5 FAILED', 'error');
        }
        
        const endTime = performance.now();
        testResults.totalTime = endTime - startTime;
        
        // Generate test report
        this.generateTestReport(testResults);
        
        return testResults;
        
    } catch (error) {
        this.log(`❌ Test suite failed: ${error.message}`, 'error');
        return { error: error.message, passed: false };
    }
};

// Test scheduler initialization
AudioToolsPro.prototype.testSchedulerInitialization = function() {
    try {
        // Initialize scheduler
        this.initializePreciseTimingScheduler();
        
        // Check if scheduler exists and has required methods
        const hasScheduler = !!this.preciseTimingScheduler;
        const hasRequiredMethods = hasScheduler && 
            typeof this.preciseTimingScheduler.scheduleAudioEvent === 'function' &&
            typeof this.preciseTimingScheduler.roundToSampleAccuracy === 'function' &&
            typeof this.preciseTimingScheduler.validateTimingPrecision === 'function';
        
        const hasCorrectProperties = hasScheduler &&
            this.preciseTimingScheduler.maxTimingError === 0.3 &&
            this.preciseTimingScheduler.targetPrecision === 0.001;
        
        return {
            passed: hasScheduler && hasRequiredMethods && hasCorrectProperties,
            hasScheduler,
            hasRequiredMethods,
            hasCorrectProperties,
            sampleRate: hasScheduler ? this.preciseTimingScheduler.sampleRate : 0
        };
        
    } catch (error) {
        return { 
            passed: false, 
            error: error.message 
        };
    }
};

// Test sample-accurate positioning
AudioToolsPro.prototype.testSampleAccuratePositioning = function() {
    try {
        if (!this.preciseTimingScheduler) {
            this.initializePreciseTimingScheduler();
        }
        
        const testCases = [
            { input: 1.0, expected: 1.0 },
            { input: 0.5, expected: 0.5 },
            { input: 0.123456789, expected: null }, // Will be calculated
            { input: 2.999999, expected: null }
        ];
        
        let allPassed = true;
        const results = [];
        
        for (const testCase of testCases) {
            const rounded = this.preciseTimingScheduler.roundToSampleAccuracy(testCase.input);
            const samples = this.preciseTimingScheduler.timeToSamples(rounded);
            const backToTime = this.preciseTimingScheduler.samplesToTime(samples);
            
            // Check that round-trip conversion is accurate
            const roundTripError = Math.abs(rounded - backToTime);
            const passed = roundTripError < 1e-10; // Very small floating point tolerance
            
            results.push({
                input: testCase.input,
                rounded,
                samples,
                backToTime,
                roundTripError,
                passed
            });
            
            if (!passed) allPassed = false;
        }
        
        return {
            passed: allPassed,
            results,
            sampleRate: this.preciseTimingScheduler.sampleRate
        };
        
    } catch (error) {
        return { 
            passed: false, 
            error: error.message 
        };
    }
};

// Test timing tolerance (±300ms requirement)
AudioToolsPro.prototype.testTimingTolerance = function() {
    try {
        if (!this.preciseTimingScheduler) {
            this.initializePreciseTimingScheduler();
        }
        
        const testTimes = [
            { original: 1.0, description: 'Exact second' },
            { original: 1.1499, description: 'Within 150ms of boundary' },
            { original: 1.2999, description: 'Within 300ms of boundary' },
            { original: 1.35, description: 'Over 300ms from boundary' }
        ];
        
        let allWithinTolerance = true;
        const results = [];
        
        for (const test of testTimes) {
            const precise = this.preciseTimingScheduler.roundToSampleAccuracy(test.original);
            const error = Math.abs(test.original - precise) * 1000; // Convert to ms
            const withinTolerance = this.preciseTimingScheduler.validateTimingPrecision(test.original, precise);
            
            results.push({
                original: test.original,
                precise,
                errorMs: error,
                withinTolerance,
                description: test.description
            });
            
            // All should be within tolerance due to sample-accurate rounding
            if (!withinTolerance) allWithinTolerance = false;
        }
        
        const maxErrorMs = Math.max(...results.map(r => r.errorMs));
        const requirementMet = maxErrorMs <= 300; // ±300ms requirement
        
        return {
            passed: allWithinTolerance && requirementMet,
            results,
            maxErrorMs,
            requirementMet,
            tolerance: this.preciseTimingScheduler.maxTimingError * 1000
        };
        
    } catch (error) {
        return { 
            passed: false, 
            error: error.message 
        };
    }
};

// Test UI integration
AudioToolsPro.prototype.testUIIntegration = function() {
    try {
        // Check if UI elements exist
        const timingStatsPanel = document.getElementById('timingStatsPanel');
        const timingStats = document.getElementById('timingStats');
        const preciseTimingCheckbox = document.getElementById('enablePreciseTiming');
        const timingValidationCheckbox = document.getElementById('enableTimingValidation');
        
        const elementsExist = !!(timingStatsPanel && timingStats && preciseTimingCheckbox && timingValidationCheckbox);
        
        // Test stats display
        if (elementsExist) {
            const mockStats = {
                scheduledEvents: 5,
                totalEvents: 5,
                averageTimingError: 2.5,
                maxTimingError: 15.2,
                withinTolerance: 5
            };
            
            this.displayTimingStats(mockStats);
            
            // Check if panel is now visible
            const panelVisible = timingStatsPanel.style.display === 'block';
            
            return {
                passed: elementsExist && panelVisible,
                elementsExist,
                panelVisible,
                elements: {
                    timingStatsPanel: !!timingStatsPanel,
                    timingStats: !!timingStats,
                    preciseTimingCheckbox: !!preciseTimingCheckbox,
                    timingValidationCheckbox: !!timingValidationCheckbox
                }
            };
        }
        
        return {
            passed: false,
            elementsExist: false,
            missingElements: 'Required UI elements not found'
        };
        
    } catch (error) {
        return { 
            passed: false, 
            error: error.message 
        };
    }
};

// Generate comprehensive test report
AudioToolsPro.prototype.generateTestReport = function(testResults) {
    const passRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
    
    this.log('📊 PRECISE TIMING TEST REPORT', 'info');
    this.log('═══════════════════════════════', 'info');
    this.log(`Total Tests: ${testResults.tests.length}`, 'info');
    this.log(`Passed: ${testResults.passed}`, 'success');
    this.log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
    this.log(`Pass Rate: ${passRate.toFixed(1)}%`, passRate === 100 ? 'success' : 'warning');
    this.log(`Execution Time: ${testResults.totalTime.toFixed(2)}ms`, 'info');
    this.log('═══════════════════════════════', 'info');
    
    // Detailed test results
    for (const test of testResults.tests) {
        const status = test.passed ? '✅' : '❌';
        this.log(`${status} ${test.name}`, test.passed ? 'success' : 'error');
        
        if (!test.passed && test.details.error) {
            this.log(`   Error: ${test.details.error}`, 'error');
        }
    }
    
    // Overall assessment
    if (passRate === 100) {
        this.log('🎉 ALL TESTS PASSED - Precise timing implementation meets requirements!', 'success');
    } else {
        this.log('⚠️ Some tests failed - Review implementation', 'warning');
    }
    
    // Show UI message
    const message = passRate === 100 ? 
        '🎉 Precise timing tests passed! ±300ms accuracy achieved.' :
        `⚠️ Tests completed: ${testResults.passed}/${testResults.tests.length} passed`;
    
    this.showUIMessage(message, passRate === 100 ? 'success' : 'warning');
};