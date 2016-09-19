module Jekyll

  class TagIndex < Page
    include Jekyll::Utils
    def initialize(site, dir, tag, num_page, posts)
      @site = site
      @base = site.source
      @dir = dir

      slug = slugify(tag)
      if num_page <= 1
        @name = slug + ".html"
      else
        @dir += '/' + slug
        @name = Paginate::Pager.paginate_path(site, num_page)
      end

      self.process(@name)
      self.read_yaml(File.join(@base, '_layouts'), 'tag.html')
      tag_title_prefix = site.config['tag_title_prefix'] || 'Tag: '

      @pager = Paginate::Pager.new(site, num_page, posts)
      self.data.merge!(
        'tag'       => tag,
        'title'     => "#{tag_title_prefix}#{tag}"
      )
    end
  end

  class TagGenerator < Generator
    safe true
    priority :lowest

    def generate(site)
      if site.layouts.key? 'tag'
        dir = site.config['tag_dir'] || 'tag'
        site.tags.each do |tag, posts|
          total = Paginate::Pager.calculate_pages(posts, site.config['paginate'])
          (1..total).each do |i|
            site.pages << TagIndex.new(site, dir, tag, i, posts)
          end
        end
      end
    end
  end

end
