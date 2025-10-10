'use client';

import { motion } from 'framer-motion';
import {
    ExternalLink,
    Github,
    Linkedin,
    Mail,
    Twitter
} from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Download', href: '#download' },
    { name: 'Documentation', href: '#docs' },
    { name: 'API Reference', href: '#api' },
    { name: 'Changelog', href: '#changelog' }
  ],
  support: [
    { name: 'Help Center', href: '#help' },
    { name: 'Community', href: '#community' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'Bug Reports', href: '#bugs' },
    { name: 'Feature Requests', href: '#features' },
    { name: 'Status Page', href: '#status' }
  ],
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Careers', href: '#careers' },
    { name: 'Press Kit', href: '#press' },
    { name: 'Partners', href: '#partners' },
    { name: 'Legal', href: '#legal' }
  ],
  resources: [
    { name: 'Tutorials', href: '#tutorials' },
    { name: 'Best Practices', href: '#best-practices' },
    { name: 'Video Guides', href: '#videos' },
    { name: 'Webinars', href: '#webinars' },
    { name: 'Case Studies', href: '#case-studies' },
    { name: 'White Papers', href: '#whitepapers' }
  ]
};

const socialLinks = [
  { name: 'GitHub', icon: Github, href: '#github' },
  { name: 'Twitter', icon: Twitter, href: '#twitter' },
  { name: 'LinkedIn', icon: Linkedin, href: '#linkedin' },
  { name: 'Email', icon: Mail, href: 'mailto:support@audiotoolspro.com' }
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AT</span>
                </div>
                <span className="ml-3 text-2xl font-bold">Audio Tools Pro</span>
              </div>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Professional-grade audio analysis and editing tools for Adobe Premiere Pro. 
                Transform your workflow with AI-powered silence detection, overlap analysis, and multi-track handling.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200 group"
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    {link.href.startsWith('#') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    {link.href.startsWith('#') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    {link.href.startsWith('#') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    {link.href.startsWith('#') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-gray-800"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Get the latest updates, tips, and new features delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-gray-400 text-sm mb-4 md:mb-0"
            >
              © 2024 Audio Tools Pro. All rights reserved.
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex space-x-6 text-sm"
            >
              <a href="#privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#cookies" className="text-gray-400 hover:text-white transition-colors duration-200">
                Cookie Policy
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
