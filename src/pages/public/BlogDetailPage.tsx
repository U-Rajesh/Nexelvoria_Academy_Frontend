import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Share2, Check, MessageSquare, Tag } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { SEO } from '../../components/common/SEO';
import { formatDate } from '../../utils/formatters';
import { cmsService } from '../../services/cmsService';
import { useNotification } from '../../context/NotificationContext';
import { Linkedin } from '../../components/common/SocialIcons';

export const BlogDetailPage: React.FC = () => {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const [copied, setCopied] = useState(false);
  const { showToast } = useNotification();

  const article = cmsService.getArticleBySlug(articleSlug || '');
  const allArticles = cmsService.getArticles();
  const relatedArticles = allArticles.filter((a) => a.slug !== articleSlug).slice(0, 2);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Article Not Found</h2>
        <p className="text-sm text-slate-500">The technical post you are looking for has moved or does not exist.</p>
        <Link to="/blog">
          <Button variant="primary">Return to Blog</Button>
        </Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Article URL copied to clipboard!',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <SEO
        title={article.title}
        description={article.excerpt}
        keywords={article.tags}
        ogType="article"
        ogImage={article.featuredImage}
      />

      {/* Back button */}
      <div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Articles
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="purple" size="sm">{article.category}</Badge>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">{article.readTime}</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">{formatDate(article.date)}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-base text-slate-600 leading-relaxed font-medium">
          {article.excerpt}
        </p>

        {/* Author bar & Share button */}
        <div className="pt-4 border-y border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={article.authorAvatar}
              alt={article.author}
              className="h-11 w-11 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">{article.author}</p>
              <p className="text-[11px] text-slate-500">{article.authorRole}</p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* Featured Cover Image */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-video w-full bg-slate-100">
        <img
          src={article.featuredImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content Body */}
      <article className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-5">
        {article.content.map((paragraph, idx) => (
          <p key={idx} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </article>

      {/* Tags */}
      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
          <Tag className="h-3.5 w-3.5" /> Tags:
        </span>
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Related Articles */}
      <div className="pt-10 border-t border-slate-200 space-y-6">
        <h3 className="text-xl font-bold text-slate-900">Recommended Reading</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {relatedArticles.map((rel) => (
            <Card key={rel.id} className="p-5 flex flex-col justify-between space-y-3 bg-white">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {rel.category}
                </span>
                <Link to={`/blog/${rel.slug}`}>
                  <h4 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </Link>
                <p className="text-xs text-slate-500 line-clamp-2">{rel.excerpt}</p>
              </div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                {rel.author} • {rel.readTime}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

