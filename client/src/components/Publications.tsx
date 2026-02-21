import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, Database, Table, FileJson, Star, Quote, ExternalLink, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useState, useMemo } from "react";

interface PublicationsProps {
  openalexId: string;
  inline?: boolean;
}

export default function Publications({ openalexId, inline = false }: PublicationsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"year" | "citations" | "title">("year");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [openAccessFilter, setOpenAccessFilter] = useState<"all" | "open" | "closed">("all");
  const [publicationTypeFilter, setPublicationTypeFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 10;
  const LOAD_MORE_COUNT = 20;
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleExportBibliography = (format: string) => {
    window.location.href = `/api/researcher/${openalexId}/export-bibliography?format=${format}`;
    setExportDialogOpen(false);
  };

  const ExportBibliographyDialog = () => (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-export-bibliography">
          <Download className="w-4 h-4 mr-2" />
          Export Bibliography
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Bibliography</DialogTitle>
          <DialogDescription>
            Choose your preferred format to download all {publications.length} publications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-4">
          <Button onClick={() => handleExportBibliography('bibtex')} variant="outline" className="justify-start h-auto py-4" data-testid="button-export-bibtex">
            <FileText className="w-5 h-5 mr-3 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold">BibTeX (.bib)</div>
              <div className="text-xs text-muted-foreground">LaTeX citation format</div>
            </div>
          </Button>
          <Button onClick={() => handleExportBibliography('ris')} variant="outline" className="justify-start h-auto py-4" data-testid="button-export-ris">
            <Database className="w-5 h-5 mr-3 text-green-600" />
            <div className="text-left">
              <div className="font-semibold">RIS (.ris)</div>
              <div className="text-xs text-muted-foreground">Research Information Systems format</div>
            </div>
          </Button>
          <Button onClick={() => handleExportBibliography('csv')} variant="outline" className="justify-start h-auto py-4" data-testid="button-export-csv">
            <Table className="w-5 h-5 mr-3 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold">CSV (.csv)</div>
              <div className="text-xs text-muted-foreground">Spreadsheet format</div>
            </div>
          </Button>
          <Button onClick={() => handleExportBibliography('json')} variant="outline" className="justify-start h-auto py-4" data-testid="button-export-json">
            <FileJson className="w-5 h-5 mr-3 text-orange-600" />
            <div className="text-left">
              <div className="font-semibold">JSON (.json)</div>
              <div className="text-xs text-muted-foreground">Structured data format</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const { data: researcherData, isLoading } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
  } | null>({
    queryKey: [`/api/researcher/${openalexId}/data`],
    retry: false,
  });

  const publications = researcherData?.publications || [];

  // Get featured publications (marked as featured OR top 3 by citations if none marked)
  const featuredPublications = useMemo(() => {
    const marked = publications.filter(pub => pub.isFeatured);
    if (marked.length > 0) return marked;

    // Auto-feature top 3 most-cited if none are manually featured
    return [...publications]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 3);
  }, [publications]);

  // Filter and sort publications
  const filteredAndSortedPublications = useMemo(() => {
    let filtered = [...publications];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pub =>
        pub.title?.toLowerCase().includes(term) ||
        pub.authorNames?.toLowerCase().includes(term) ||
        pub.journal?.toLowerCase().includes(term) ||
        pub.topics?.some((topic: string) => topic.toLowerCase().includes(term))
      );
    }

    // Apply year filter
    if (yearFilter && yearFilter !== "all") {
      filtered = filtered.filter(pub => pub.publicationYear?.toString() === yearFilter);
    }

    // Apply open access filter
    if (openAccessFilter !== "all") {
      filtered = filtered.filter(pub =>
        openAccessFilter === "open" ? pub.isOpenAccess : !pub.isOpenAccess
      );
    }

    // Apply publication type filter
    if (publicationTypeFilter && publicationTypeFilter !== "all") {
      filtered = filtered.filter(pub => pub.publicationType === publicationTypeFilter);
    }

    // Sort publications
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "year":
          aValue = a.publicationYear || 0;
          bValue = b.publicationYear || 0;
          break;
        case "citations":
          aValue = a.citationCount || 0;
          bValue = b.citationCount || 0;
          break;
        case "title":
          aValue = a.title || "";
          bValue = b.title || "";
          break;
        default:
          return 0;
      }

      if (sortBy === "title") {
        return sortOrder === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      } else {
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
    });

    return filtered;
  }, [publications, searchTerm, sortBy, sortOrder, yearFilter, openAccessFilter, publicationTypeFilter]);

  // Get unique years for filter dropdown
  const availableYears = useMemo(() => {
    const years = publications
      .map(pub => pub.publicationYear)
      .filter(year => year)
      .sort((a, b) => b - a);
    return Array.from(new Set(years));
  }, [publications]);

  // Get unique publication types for filter dropdown
  const availablePublicationTypes = useMemo(() => {
    const types = publications
      .map(pub => pub.publicationType)
      .filter(type => type);
    return Array.from(new Set(types));
  }, [publications]);

  const displayedPublications = showAll ? filteredAndSortedPublications : filteredAndSortedPublications.slice(0, INITIAL_COUNT);

  if (isLoading) {
    return (
      <section id="publications" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-64 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const content = (
    <>
      {!inline && (
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-midnight dark:text-white mb-2">
            Publications
            {publications.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs md:text-sm">
                {publications.length}
              </Badge>
            )}
          </h2>
        </div>
      )}

      {/* Featured Publications Section */}
      {featuredPublications.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-serif font-bold text-midnight dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-warm fill-warm" />
            Featured Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredPublications.slice(0, 3).map((pub: any, index: number) => (
              <Card
                key={pub.id}
                className="bg-white/80 dark:bg-midnight/40 backdrop-blur-xl border-l-4 border-l-warm border-platinum dark:border-white/20 shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all"
                data-testid={`card-featured-${index}`}
              >
                <CardContent className="p-4">
                  <h4 className="font-serif font-bold text-base text-midnight dark:text-white line-clamp-2 mb-2">{pub.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{pub.authorNames}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{pub.publicationYear}</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {pub.citationCount?.toLocaleString() || 0} citations
                    </span>
                  </div>
                  {pub.doi && (
                    <a
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary hover:underline mt-2"
                    >
                      View →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      {publications.length > 0 && (
        <Card className="mb-4 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-end">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-2 block">Search Publications</label>
                <Input
                  placeholder="Search by title, author, journal, or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search-publications"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value: "year" | "citations" | "title") => setSortBy(value)}>
                  <SelectTrigger data-testid="select-sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Publication Year</SelectItem>
                    <SelectItem value="citations">Citation Count</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select value={sortOrder} onValueChange={(value: "desc" | "asc") => setSortOrder(value)}>
                  <SelectTrigger data-testid="select-sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setYearFilter("all");
                    setOpenAccessFilter("all");
                    setPublicationTypeFilter("all");
                    setSortBy("year");
                    setSortOrder("desc");
                  }}
                  className="w-full"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Year Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Publication Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger data-testid="select-year-filter">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Publication Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Publication Type</label>
                <Select value={publicationTypeFilter} onValueChange={setPublicationTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {availablePublicationTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Open Access Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Access Type</label>
                <Select value={openAccessFilter} onValueChange={(value: "all" | "open" | "closed") => setOpenAccessFilter(value)}>
                  <SelectTrigger data-testid="select-access-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="open">Open Access</SelectItem>
                    <SelectItem value="closed">Closed Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Info */}
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  Showing {displayedPublications.length} of {filteredAndSortedPublications.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {publications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Publications"
          description="No publications available. Please sync your data in the admin panel."
        />
      ) : filteredAndSortedPublications.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Results"
          description="No publications match your current filters."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setSearchTerm("");
              setYearFilter("all");
              setOpenAccessFilter("all");
              setPublicationTypeFilter("all");
            },
          }}
        />
      ) : (
        <div className="space-y-6">
          {displayedPublications.map((publication: any, index: number) => (
            <Card
              key={publication.id}
              className={`bg-white/70 dark:bg-midnight/30 backdrop-blur-xl shadow-lg border-platinum dark:border-white/20 hover:-translate-y-1 hover:shadow-2xl transition-all ${publication.isFeatured ? 'border-l-4 border-l-warm' : 'border-l-4 border-l-sage'}`}
              data-testid={`card-publication-${index}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      {publication.isFeatured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                      )}
                      <h3 className="font-serif font-bold text-xl text-midnight dark:text-white" data-testid={`text-publication-title-${index}`}>
                        {publication.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3" data-testid={`text-publication-authors-${index}`}>
                      {publication.authorNames}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      {publication.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Featured
                        </Badge>
                      )}
                      {publication.journal && (
                        <span className="text-sm text-muted-foreground" data-testid={`text-publication-journal-${index}`}>
                          {publication.journal}
                        </span>
                      )}
                      {publication.publicationYear && (
                        <span className="text-sm text-muted-foreground" data-testid={`text-publication-year-${index}`}>
                          {publication.publicationYear}
                        </span>
                      )}
                      <div className="flex items-center">
                        <Quote className="w-3.5 h-3.5 text-accent mr-1" />
                        <span className="text-sm font-medium text-accent" data-testid={`text-publication-citations-${index}`}>
                          {publication.citationCount} citations
                        </span>
                      </div>
                    </div>
                    {publication.topics && publication.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(publication.topics as string[]).slice(0, 3).map((topic, topicIndex) => (
                          <span key={topicIndex} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded" data-testid={`tag-topic-${index}-${topicIndex}`}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col items-end space-y-2">
                    {publication.pdfUrl && (
                      <a
                        href={publication.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                        data-testid={`link-publication-pdf-${index}`}
                      >
                        <FileText className="w-4 h-4" />
                        Download PDF
                      </a>
                    )}
                    {publication.doi && (
                      <a
                        href={`https://doi.org/${publication.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                        data-testid={`link-publication-doi-${index}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1 inline" />View Publication
                      </a>
                    )}
                    {publication.isOpenAccess && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded" data-testid={`badge-open-access-${index}`}>
                        Open Access
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredAndSortedPublications.length > INITIAL_COUNT && !showAll && (
        <div className="text-center mt-12">
          <Button
            onClick={() => setShowAll(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mr-4"
            data-testid="button-view-all-publications"
          >
            View All {filteredAndSortedPublications.length} Publications
          </Button>
          <ExportBibliographyDialog />
        </div>
      )}

      {showAll && filteredAndSortedPublications.length > INITIAL_COUNT && (
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-3">
            Showing all {filteredAndSortedPublications.length} publications
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setShowAll(false);
              // Scroll back to publications section
              document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mr-4"
            data-testid="button-show-less"
          >
            Show Less
          </Button>
          <ExportBibliographyDialog />
        </div>
      )}
    </>
  );

  if (inline) {
    return <div data-testid="section-publications">{content}</div>;
  }

  return (
    <section id="publications" className="py-8 md:py-16 bg-academic-motif relative" data-testid="section-publications">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {content}
      </div>
    </section>
  );
}
