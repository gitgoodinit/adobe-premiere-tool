'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Download, Upload, Zap } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Download & Install',
    description: 'Download the Audio Tools Pro plugin and install it in your Adobe Premiere Pro extensions folder.',
    icon: Download,
    details: [
      'Compatible with all recent Premiere Pro versions',
      'One-click installation process',
      'Automatic CEP integration',
      'No additional software required'
    ]
  },
  {
    number: '02',
    title: 'Load Your Audio',
    description: 'Import your audio files into Premiere Pro and select the clips you want to analyze.',
    icon: Upload,
    details: [
      'Support for all major audio formats',
      'Multi-track audio support',
      'Batch processing capabilities',
      'Real-time preview'
    ]
  },
  {
    number: '03',
    title: 'AI Analysis',
    description: 'Let our AI-powered algorithms analyze your audio for silence, overlaps, and quality issues.',
    icon: Zap,
    details: [
      'Multi-method analysis approach',
      'OpenAI Whisper integration',
      'Real-time processing',
      'Confidence scoring'
    ]
  },
  {
    number: '04',
    title: 'Review & Apply',
    description: 'Review the analysis results and apply automatic fixes or manual adjustments as needed.',
    icon: CheckCircle,
    details: [
      'Interactive timeline visualization',
      'One-click auto-fix options',
      'Manual adjustment tools',
      'Export processed audio'
    ]
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get started with Audio Tools Pro in just a few simple steps. Our intuitive workflow makes professional audio analysis accessible to everyone.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 dark:from-blue-800 dark:via-purple-800 dark:to-blue-800 transform -translate-y-1/2"></div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {step.number}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Details */}
                      <ul className="space-y-2 text-left">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Transform Your Audio Workflow?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Join thousands of professionals who trust Audio Tools Pro for their audio editing needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200">
                <Download className="w-5 h-5 mr-2" />
                Download Now
              </button>
              <button className="inline-flex items-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                View Documentation
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
