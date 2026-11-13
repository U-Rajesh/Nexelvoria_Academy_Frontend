import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ArrowRight, Tag, Clock } from 'lucide-react';
import { PageLabel } from '../../components/common/PageLabel';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SEO } from '../../components/common/SEO';
import { formatDate } from '../../utils/formatters';
import { cmsService, type BlogArticle } from '../../services/cmsService';

export const BlogPage: React.FC = () => {
  const [articles] = useState<BlogArticle[]>(() => cmsService.getArticles());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Java & Cloud', 'Architecture', 'Placement Prep', 'DevOps'];

  const filteredArticles = articles.filter((art) => {
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const featured = articles[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
      <SEO
        title="Technical Insights, System Design & Career Guides"
        description="Deep dives into enterprise Java, Project Loom virtual threads, Apache Kafka saga architectures, and tech interview preparation."
        keywords={['Software Engineering Blog', 'System Design Guides', 'Java 21 Virtual Threads', 'Kafka Microservices']}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <PageLabel>Engineering Publications</PageLabel>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Technical Insights & Career Roadmaps
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Written by our practicing technology leads and senior faculty architects.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, Kafka, Redis..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Featured Article Banner (Only on "All" view with empty search) */}
      {selectedCategory === 'All' && !searchQuery && featured && (
        <Card className="overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-0 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="p-8 sm:p-12 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Featured Article
                </span>
                <span className="text-xs text-indigo-300 font-medium">{featured.readTime}</span>
              </div>
              <Link to={`/blog/${featured.slug}`}>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white hover:text-indigo-200 transition-colors leading-tight">
                  {featured.title}
                </h2>
              </Link>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                {featured.excerpt}
              </p>
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={featured.authorAvatar}
                    alt={featured.author}
                    className="h-9 w-9 rounded-full object-cover border border-indigo-400/50"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{featured.author}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(featured.date)}</p>
                  </div>
                </div>
                <Link to={`/blog/${featured.slug}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Read Article
                  </Button>
                </Link>
              </div>
            </div>

            <div className="h-full min-h-[260px] overflow-hidden hidden lg:block">
              <img
                src={featured.featuredImage}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-bold text-slate-800">No articles found</p>
          <p className="text-xs text-slate-500">Try modifying your query or category selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredArticles.map((art) => (
            <Card key={art.id} className="overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-200 bg-white">
              <div className="relative h-44 w-full bg-slate-100">
                <img
                  src={art.featuredImage}
                  alt={art.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-white/95 text-indigo-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                  {art.category}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <span className="text-[11px] text-slate-400 font-medium">{art.readTime} • {formatDate(art.date)}</span>
                  <Link to={`/blog/${art.slug}`}>
                    <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-indigo-600 transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {art.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-semibold">{art.author}</span>
                    <Link to={`/blog/${art.slug}`} className="text-indigo-600 font-bold hover:underline">
                      Read Full Post →
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
