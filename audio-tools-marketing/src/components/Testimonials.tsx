'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Video Editor',
    company: 'Creative Studios',
    avatar: 'SC',
    content: 'Audio Tools Pro has completely transformed my workflow. The AI-powered silence detection is incredibly accurate, and I can process hours of audio in minutes instead of hours.',
    rating: 5
  },
  {
    name: 'Michael Rodriguez',
    role: 'Podcast Producer',
    company: 'SoundWave Media',
    avatar: 'MR',
    content: 'The multi-track handling and overlap detection features are game-changers. I can now handle complex audio projects with confidence, knowing the AI will catch issues I might miss.',
    rating: 5
  },
  {
    name: 'Emily Johnson',
    role: 'Content Creator',
    company: 'Digital Productions',
    avatar: 'EJ',
    content: 'As someone who was intimidated by audio editing, Audio Tools Pro made it accessible. The interface is intuitive, and the results are professional-grade.',
    rating: 5
  },
  {
    name: 'David Kim',
    role: 'Film Editor',
    company: 'Cinema Arts',
    avatar: 'DK',
    content: 'The integration with Premiere Pro is seamless. I love how it automatically detects and fixes audio issues while maintaining the highest quality standards.',
    rating: 5
  },
  {
    name: 'Lisa Thompson',
    role: 'Audio Engineer',
    company: 'Studio One',
    avatar: 'LT',
    content: 'The EBU R128 compliance and professional standards make this plugin essential for broadcast work. It saves me hours of manual analysis.',
    rating: 5
  },
  {
    name: 'Alex Martinez',
    role: 'YouTuber',
    company: 'Independent Creator',
    avatar: 'AM',
    content: 'Perfect for content creators! The real-time analysis and one-click fixes help me maintain consistent audio quality across all my videos.',
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
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
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of satisfied users who have transformed their audio workflow with Audio Tools Pro.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group"
            >
              {/* Quote Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Quote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex justify-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Professionals Worldwide
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join the growing community of audio professionals who rely on Audio Tools Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">4.9/5</div>
              <div className="text-gray-600 dark:text-gray-300">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-300">Hours Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
