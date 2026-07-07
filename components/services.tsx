'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SERVICE_ITEMS } from '@/lib/service-config';

export default function Services() {
  return (
    <section className="animate-fade-in">
      <div className="card">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--card-border))]">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[hsl(var(--primary))] rounded-full" />
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">办事服务</h2>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SERVICE_ITEMS.map((service) => (
              <Link
                key={service.id}
                href={service.route}
                className="group flex flex-col items-center text-center p-4 rounded-xl border border-[hsl(var(--card-border))] hover:border-[hsl(var(--primary))] hover:shadow-lg transition-all duration-300 bg-gradient-to-b from-white to-gray-50 hover:to-white"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  {/* Icon rendered via CSS class */}
                  <span className="text-white text-lg">{service.icon ? '' : ''}</span>
                </div>
                <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-2 mb-1">
                  {service.title}
                </h3>
                <p className="text-xs text-[hsl(var(--foreground-muted))] line-clamp-2">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
