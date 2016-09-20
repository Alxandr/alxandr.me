module Jekyll
  class SeriesGenerator < Generator
    safe true

    def generate(site)
      site_url = url = site.baseurl
      series = Hash.new
      site.posts.docs.each do |page|
        if page.data['series'] && page.published?
          name = page.data['series']
          if series[name]
            series[name] << page
          else
            series[name] = [page]
          end
        end
      end

      series.each do |name, posts|
        series_posts = posts.map do |post|
          { 'title' => post.data['title'], 'url' => "#{site_url}#{post.url}" }
        end
        
        posts.each_with_index do |post, index|
          series = { 'posts' => series_posts }
          if index > 0
            series['prev'] = series_posts[index - 1]
          end
          if index < series_posts.length - 1
            series['next'] = series_posts[index + 1]
          end
          post.data['series'] = series
        end
      end
    end
  end
end
