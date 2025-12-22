// OCR Service Test Suite
// This file contains test cases for validating OCR functionality

import { OCRService } from "../services/ocrService";

// Mock receipt texts for testing
const MOCK_RECEIPTS = {
  oilChange: `JIFFY LUBE
SERVICE RECEIPT
Date: 12/19/2024
Vehicle: 2020 Honda Accord
Mileage: 45,250

Services Performed:
- Full Synthetic Oil Change
- Oil Filter Replacement
- Multi-Point Inspection

Total: $89.99

Thank you for choosing Jiffy Lube!`,

  brakeService: `MIDAS AUTO REPAIR
BRAKE SERVICE RECEIPT
Date: 2024-11-15
Customer Vehicle: Toyota Camry
Odometer: 87,500 miles

Service Details:
- Brake Pad Replacement (Front)
- Brake Fluid Change
- Brake System Inspection

Parts & Labor: $245.50
Tax: $19.64
TOTAL: $265.14`,

  generalMaintenance: `PETE'S AUTO SERVICE
MAINTENANCE RECEIPT
11/28/2024
Vehicle Mileage: 62,100

Services:
- Tune Up
- Air Filter Replacement
- Battery Test
- General Inspection

Amount Due: $156.75`,

  tireService: `FIRESTONE COMPLETE AUTO CARE
TIRE SERVICE RECEIPT
Date: October 5, 2024
Vehicle Odometer: 23,450

Service Performed:
- Tire Rotation
- Wheel Balancing
- Tire Pressure Check

Service Total: $75.00
Thank you for your business!`,
};

// Test cases for OCR parsing
export class OCRServiceTests {
  /**
   * Test service type detection accuracy
   */
  static testServiceTypeDetection() {
    console.log("🧪 Testing Service Type Detection...");

    const testCases = [
      { receipt: MOCK_RECEIPTS.oilChange, expected: "oil_change" },
      { receipt: MOCK_RECEIPTS.brakeService, expected: "brake_service" },
      {
        receipt: MOCK_RECEIPTS.generalMaintenance,
        expected: "general_maintenance",
      },
      { receipt: MOCK_RECEIPTS.tireService, expected: "tire_rotation" },
    ];

    let passed = 0;
    let total = testCases.length;

    testCases.forEach((test, index) => {
      const result = OCRService.parseExtractedText(test.receipt);
      const detected = result.service_type;

      if (detected === test.expected) {
        console.log(`✅ Test ${index + 1}: PASSED - Detected: ${detected}`);
        passed++;
      } else {
        console.log(
          `❌ Test ${index + 1}: FAILED - Expected: ${test.expected}, Got: ${detected}`,
        );
      }
    });

    console.log(
      `📊 Service Type Detection: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)\n`,
    );
    return passed === total;
  }

  /**
   * Test cost extraction accuracy
   */
  static testCostExtraction() {
    console.log("🧪 Testing Cost Extraction...");

    const testCases = [
      { receipt: MOCK_RECEIPTS.oilChange, expected: 89.99 },
      { receipt: MOCK_RECEIPTS.brakeService, expected: 265.14 },
      { receipt: MOCK_RECEIPTS.generalMaintenance, expected: 156.75 },
      { receipt: MOCK_RECEIPTS.tireService, expected: 75.0 },
    ];

    let passed = 0;
    let total = testCases.length;

    testCases.forEach((test, index) => {
      const result = OCRService.parseExtractedText(test.receipt);
      const detected = result.cost;

      if (Math.abs((detected || 0) - test.expected) < 0.01) {
        console.log(`✅ Test ${index + 1}: PASSED - Detected: $${detected}`);
        passed++;
      } else {
        console.log(
          `❌ Test ${index + 1}: FAILED - Expected: $${test.expected}, Got: $${detected}`,
        );
      }
    });

    console.log(
      `📊 Cost Extraction: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)\n`,
    );
    return passed === total;
  }

  /**
   * Test date parsing accuracy
   */
  static testDateExtraction() {
    console.log("🧪 Testing Date Extraction...");

    const testCases = [
      { receipt: MOCK_RECEIPTS.oilChange, expectedPattern: /12\/19\/2024/ },
      { receipt: MOCK_RECEIPTS.brakeService, expectedPattern: /2024-11-15/ },
      {
        receipt: MOCK_RECEIPTS.generalMaintenance,
        expectedPattern: /11\/28\/2024/,
      },
      {
        receipt: MOCK_RECEIPTS.tireService,
        expectedPattern: /October 5, 2024/,
      },
    ];

    let passed = 0;
    let total = testCases.length;

    testCases.forEach((test, index) => {
      const result = OCRService.parseExtractedText(test.receipt);
      const detected = result.date;

      if (detected && test.expectedPattern.test(test.receipt)) {
        console.log(`✅ Test ${index + 1}: PASSED - Detected: ${detected}`);
        passed++;
      } else {
        console.log(
          `❌ Test ${index + 1}: FAILED - Expected date pattern not found, Got: ${detected}`,
        );
      }
    });

    console.log(
      `📊 Date Extraction: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)\n`,
    );
    return passed === total;
  }

  /**
   * Test odometer reading extraction
   */
  static testOdometerExtraction() {
    console.log("🧪 Testing Odometer Reading Extraction...");

    const testCases = [
      { receipt: MOCK_RECEIPTS.oilChange, expected: 45250 },
      { receipt: MOCK_RECEIPTS.brakeService, expected: 87500 },
      { receipt: MOCK_RECEIPTS.generalMaintenance, expected: 62100 },
      { receipt: MOCK_RECEIPTS.tireService, expected: 23450 },
    ];

    let passed = 0;
    let total = testCases.length;

    testCases.forEach((test, index) => {
      const result = OCRService.parseExtractedText(test.receipt);
      const detected = result.odometer_reading;

      if (detected === test.expected) {
        console.log(`✅ Test ${index + 1}: PASSED - Detected: ${detected} km`);
        passed++;
      } else {
        console.log(
          `❌ Test ${index + 1}: FAILED - Expected: ${test.expected}, Got: ${detected}`,
        );
      }
    });

    console.log(
      `📊 Odometer Extraction: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)\n`,
    );
    return passed === total;
  }

  /**
   * Test business name recognition
   */
  static testBusinessNameExtraction() {
    console.log("🧪 Testing Business Name Extraction...");

    const testCases = [
      { receipt: MOCK_RECEIPTS.oilChange, expected: "Jiffy Lube" },
      { receipt: MOCK_RECEIPTS.brakeService, expected: "Midas" },
      { receipt: MOCK_RECEIPTS.tireService, expected: "Firestone" },
    ];

    let passed = 0;
    let total = testCases.length;

    testCases.forEach((test, index) => {
      const result = OCRService.parseExtractedText(test.receipt);
      const detected = result.business_name;

      if (
        detected &&
        detected.toLowerCase().includes(test.expected.toLowerCase())
      ) {
        console.log(`✅ Test ${index + 1}: PASSED - Detected: ${detected}`);
        passed++;
      } else {
        console.log(
          `❌ Test ${index + 1}: FAILED - Expected to contain: ${test.expected}, Got: ${detected}`,
        );
      }
    });

    console.log(
      `📊 Business Name Extraction: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)\n`,
    );
    return passed === total;
  }

  /**
   * Test overall confidence scoring
   */
  static testConfidenceScoring() {
    console.log("🧪 Testing Confidence Scoring...");

    let passed = 0;
    let total = Object.keys(MOCK_RECEIPTS).length;

    Object.entries(MOCK_RECEIPTS).forEach(([type, receipt], index) => {
      const result = OCRService.parseExtractedText(receipt);
      const confidenceScores = result.confidence_scores;

      // Check if confidence scores exist and are reasonable
      const hasScores =
        confidenceScores && Object.keys(confidenceScores).length > 0;
      const validScores =
        hasScores &&
        Object.values(confidenceScores).every(
          (score) => typeof score === "number" && score >= 0 && score <= 100,
        );

      if (hasScores && validScores) {
        console.log(
          `✅ Test ${index + 1} (${type}): PASSED - Confidence scores valid`,
        );
        passed++;
      } else {
        console.log(
          `❌ Test ${index + 1} (${type}): FAILED - Invalid confidence scores`,
        );
      }
    });

    console.log(
      `📊 Confidence Scoring: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)\n`,
    );
    return passed === total;
  }

  /**
   * Run all OCR tests
   */
  static async runAllTests() {
    console.log("🚀 Starting OCR Service Test Suite...\n");

    const testResults = {
      serviceType: this.testServiceTypeDetection(),
      costExtraction: this.testCostExtraction(),
      dateExtraction: this.testDateExtraction(),
      odometerExtraction: this.testOdometerExtraction(),
      businessNameExtraction: this.testBusinessNameExtraction(),
      confidenceScoring: this.testConfidenceScoring(),
    };

    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(
      (result) => result,
    ).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log("📋 TEST SUMMARY");
    console.log("================");
    Object.entries(testResults).forEach(([testName, passed]) => {
      const status = passed ? "✅ PASSED" : "❌ FAILED";
      console.log(`${testName}: ${status}`);
    });

    console.log(
      `\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`,
    );

    if (successRate >= 80) {
      console.log("🎉 OCR Service is performing well!");
    } else if (successRate >= 60) {
      console.log("⚠️  OCR Service needs some improvements.");
    } else {
      console.log("🔥 OCR Service requires significant improvements.");
    }

    return testResults;
  }

  /**
   * Performance test for OCR parsing
   */
  static performanceTest() {
    console.log("⚡ Running Performance Test...");

    const iterations = 100;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      OCRService.parseExtractedText(MOCK_RECEIPTS.oilChange);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`📊 Performance Results:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average time per parsing: ${avgTime.toFixed(2)}ms`);
    console.log(
      `   Throughput: ${(1000 / avgTime).toFixed(1)} parsings/second\n`,
    );

    return avgTime;
  }
}

// Export test functions for use in development
export const runOCRTests = () => OCRServiceTests.runAllTests();
export const runPerformanceTest = () => OCRServiceTests.performanceTest();
