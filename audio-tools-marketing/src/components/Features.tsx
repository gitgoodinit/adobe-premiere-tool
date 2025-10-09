'use client';

import { motion } from 'framer-motion';
import {
    BarChart3,
    Brain,
    Clock,
    Headphones,
    Layers,
    Mic,
    Settings,
    Volume2,
    VolumeX,
    Waves
} from 'lucide-react';

const features = [
  {
    icon: VolumeX,
    title: 'AI-Powered Silence Detection',
    description: 'Multi-method silence detection using FFmpeg, Web Audio API, and OpenAI Whisper for precise audio analysis.',
    highlights: ['Whisper AI validation', 'Multi-method consensus', 'Smart result merging', 'Confidence scoring'],
    color: 'blue'
  },
  {
    icon: Volume2,
    title: 'Advanced Overlap Detection',
    description: 'Detect audio overlaps with frequency-domain analysis, cross-correlation, and AI-powered validation.',
    highlights: ['Clipping detection', 'EBU R128 compliance', 'Frequency analysis', 'Auto-resolution'],
    color: 'green'
  },
  {
    icon: Layers,
    title: 'Multi-Track Audio Handling',
    description: 'Professional multi-track processing with up to 6 tracks, submix routing, and dynamic ducking.',
    highlights: ['Up to 6 tracks', 'Submix routing', 'Dynamic ducking', 'Multi-camera sync'],
    color: 'purple'
  },
  {
    icon: Brain,
    title: 'AI Integration',
    description: 'OpenAI Whisper transcription and GPT-4 validation for enhanced accuracy and quality assessment.',
    highlights: ['Whisper transcription', 'GPT-4 validation', 'Smart preprocessing', 'Confidence scoring'],
    color: 'pink'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analysis',
    description: 'AudioWorklet-based real-time audio analysis with low-latency performance and live preview.',
    highlights: ['Real-time processing', 'Low latency', 'Live preview', 'AudioWorklet technology'],
    color: 'orange'
  },
  {
    icon: Settings,
    title: 'Professional Standards',
    description: 'EBU R128 loudness compliance, broadcast standards, and professional audio processing capabilities.',
    highlights: ['EBU R128 compliance', 'Broadcast standards', 'Professional quality', 'Industry standards'],
    color: 'indigo'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
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
            Powerful Features for Professional Audio
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Transform your Adobe Premiere Pro workflow with cutting-edge AI technology and professional-grade audio analysis tools.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
              green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
              purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
              pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
              orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
              indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            };

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]} mb-6`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Highlights */}
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, highlightIndex) => (
                    <li key={highlightIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      {highlight}
                    </li>
                  ))}
                </ul>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced Audio Processing Capabilities
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Built for professionals who demand the highest quality and performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
                <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Speech Analysis</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced speech detection and transcription</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
                <Headphones className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Audio Quality</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Professional-grade audio processing</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-4">
                <Waves className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Processing</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Low-latency audio analysis</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl mb-4">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Time-saving</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Automated workflows and batch processing</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
