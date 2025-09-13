import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  ExclamationTriangleIcon,
  UsersIcon,
  MapPinIcon,
  ChartBarIcon,
  ArrowRightIcon,
  BoltIcon,
  BuildingOffice2Icon,
  FireIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: ExclamationTriangleIcon,
      title: t('home.features.reportIssues'),
      description: t('home.features.reportIssuesDesc'),
    },
    {
      icon: UsersIcon,
      title: t('home.features.community'),
      description: t('home.features.communityDesc'),
    },
    {
      icon: MapPinIcon,
      title: t('home.features.tracking'),
      description: t('home.features.trackingDesc'),
    },
    {
      icon: ChartBarIcon,
      title: t('home.features.analytics'),
      description: t('home.features.analyticsDesc'),
    },
  ];

  const [trending, setTrending] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [stats, setStats] = useState([
    { label: t('home.stats.issuesReported'), value: '—' },
    { label: t('home.stats.issuesResolved'), value: '—' },
    { label: t('home.stats.activeUsers'), value: '—' },
    { label: t('home.stats.communities'), value: '—' },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/complaints?limit=24');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.complaints || []);
          const sorted = [...items].sort((a,b) => {
            const ea = (a.upvoteCount||0) + (a.downvoteCount||0) + (a.commentCount||0);
            const eb = (b.upvoteCount||0) + (b.downvoteCount||0) + (b.commentCount||0);
            return eb - ea;
          }).slice(0,6);
          setTrending(sorted);
          // derive simple stats
          const total = (data?.pagination?.total) ?? items.length;
          setStats([
            { label: t('home.stats.issuesReported'), value: String(total) },
            { label: t('home.stats.issuesResolved'), value: '—' },
            { label: t('home.stats.activeUsers'), value: '—' },
            { label: t('home.stats.communities'), value: '—' },
          ]);
        }
      } catch(err) {
        // ignore for home fail-soft
      } finally {
        setLoadingTrending(false);
      }
    };
    load();
  }, [t]);

  return (
    <div className="page-container">
      {/* Immersive Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1520962919437-1b38a6feaf2e?q=80&w=1600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'contrast(1.05) saturate(1.05)'
          }}
        />
        <div className="absolute inset-0 bg-primary-900/60 mix-blend-multiply" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {t('home.hero.title')}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-100/95 max-w-2xl">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="inline-flex items-center px-6 py-3 rounded-md text-base font-medium text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  {t('home.hero.goToDashboard')}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="inline-flex items-center px-6 py-3 rounded-md text-base font-medium text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    {t('home.hero.getStarted')}
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center px-6 py-3 rounded-md text-base font-medium border-2 border-white text-white hover:bg-white hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                    {t('auth.login')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real City Problems Grid */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Real problems in our cities</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-center mb-12">From potholes to power cuts — explore common issues affecting daily life and how citizens are responding.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{
              title: 'Potholes & Broken Roads',
              icon: WrenchScrewdriverIcon,
              img: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=800&auto=format&fit=crop',
              desc: 'Damaged roads increase accidents and commute time.'
            },{
              title: 'Overflowing Garbage',
              icon: TrashIcon,
              img: 'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=800&auto=format&fit=crop',
              desc: 'Irregular collection leads to health and hygiene risks.'
            },{
              title: 'Water Supply Issues',
              icon: BeakerIcon,
              img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
              desc: 'Shortages and leakages disrupt households and businesses.'
            },{
              title: 'Frequent Power Cuts',
              icon: BoltIcon,
              img: 'https://images.unsplash.com/photo-1523860713511-85f4b02c7d77?q=80&w=800&auto=format&fit=crop',
              desc: 'Outages cause productivity loss and safety concerns.'
            },{
              title: 'Unsafe Public Spaces',
              icon: BuildingOffice2Icon,
              img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
              desc: 'Poor lighting and maintenance impact community wellbeing.'
            },{
              title: 'Fire Safety Hazards',
              icon: FireIcon,
              img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop',
              desc: 'Blocked exits and outdated systems increase risk.'
            }].map((card, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl shadow hover:shadow-lg bg-white dark:bg-gray-800">
                <div className="aspect-video w-full overflow-hidden">
                  <img src={card.img} alt={card.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <card.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
                  <div className="mt-4">
                    <Link to="/complaints" className="text-primary-600 hover:text-primary-700 text-sm font-medium">See related complaints →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Complaints */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Trending complaints</h2>
            <Link to="/complaints" className="text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          {loadingTrending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((c) => (
                <Link key={c._id} to={`/complaints/${c._id}`} className="block bg-gray-50 dark:bg-gray-900 rounded-xl p-5 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-primary-600 mt-1" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">{c.category || 'Other'}</span>
                        <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="mt-2 font-semibold text-gray-900 dark:text-white line-clamp-2">{c.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{c.description}</p>
                      <div className="mt-3 text-xs text-gray-500">
                        {c?.location?.address || 'Unknown location'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          {!isAuthenticated && (
            <Link to="/signup" className="inline-flex items-center px-6 py-3 rounded-md text-base font-medium text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              {t('home.cta.joinNow')}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;