import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";

interface PublicationsProps {
  openalexId: string;
}

export default function Publications({ openalexId }: PublicationsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"year" | "citations" | "title">("year");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [openAccessFilter, setOpenAccessFilter] = useState<"all" | "open" | "closed">("all");
  const [publicationTypeFilter, setPublicationTypeFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);

  const handleExportBibliography = () => {
    window.location.href = `/api/researcher/${openalexId}/export`;
  };

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

  const displayedPublications = showAll ? filteredAndSortedPublications : filteredAndSortedPublications.slice(0, 10);

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

  return (
    <section id="publications" className="py-16" data-testid="section-publications">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Publications
            {publications.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-sm">
                {filteredAndSortedPublications.length} of {publications.length}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Research contributions with search and filtering capabilities.
          </p>
        </div>

        {/* Search and Filter Controls */}
        {publications.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No publications available. Please sync your data in the admin panel.</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedPublications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No publications match your current filters.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setYearFilter("all");
                  setOpenAccessFilter("all");
                  setPublicationTypeFilter("all");
                }}
                className="mt-2"
                data-testid="button-clear-search"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {displayedPublications.map((publication: any, index: number) => (
              <Card key={publication.id} className="hover:shadow-xl transition-shadow" data-testid={`card-publication-${index}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-card-foreground hover:text-primary cursor-pointer" data-testid={`text-publication-title-${index}`}>
                        {publication.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3" data-testid={`text-publication-authors-${index}`}>
                        {publication.authorNames}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mb-3">
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
                          <i className="fas fa-quote-right text-accent mr-1"></i>
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
                      {publication.doi && (
                        <a 
                          href={`https://doi.org/${publication.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                          data-testid={`link-publication-doi-${index}`}
                        >
                          <i className="fas fa-external-link-alt mr-1"></i>View Publication
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
        
        {filteredAndSortedPublications.length > 10 && !showAll && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => setShowAll(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mr-4" 
              data-testid="button-view-all-publications"
            >
              View All {filteredAndSortedPublications.length} Publications
            </Button>
            <Button variant="outline" onClick={handleExportBibliography} data-testid="button-export-bibliography">
              Export Bibliography
            </Button>
          </div>
        )}

        {showAll && filteredAndSortedPublications.length > 10 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline"
              onClick={() => setShowAll(false)}
              className="mr-4" 
              data-testid="button-show-less"
            >
              Show Less
            </Button>
            <Button variant="outline" onClick={handleExportBibliography} data-testid="button-export-bibliography">
              Export Bibliography
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
