import React, { Component } from 'react';

import { Index } from 'elasticlunr';
import PostList from '../components/post-list';
import PropTypes from 'prop-types';
import RootLayout from '../components/layout/root';
import Styled from '../utils/styled';
import debounce from 'lodash.debounce';
import graphql from 'graphql';
import { navigateTo } from 'gatsby-link';
import qs from 'qs';

const getSearch = ({ location }) => {
  if (!location) return '';
  if (!location.search) return '';

  const query = location.search.substring(1);
  const parsed = qs.parse(query);
  if (!parsed.q) return '';
  return parsed.q;
};

export default class Search extends Component {
  constructor(props, context) {
    super(props, context);

    const doSearch = debounce(() => {
      this.setState(s => ({ ...s, hits: this.getHits(s.query) }));
    }, 500);

    this.updateQuery = evt => {
      const text = evt.target.value;
      const newQuery = qs.stringify({ q: text }, { format: 'RFC1738' });
      navigateTo(`?${newQuery}`);
      this.setState(s => {
        doSearch();
        return { ...s, query: text };
      });
    };

    const query = getSearch(props);
    this.state = {
      query,
      hits: this.getHits(query),
    };
  }

  createIndex() {
    this.index = Index.load(this.props.data.blogSearchIndex.index);
  }

  getHits(query) {
    if (!query) return [];

    if (!this.index) this.createIndex();
    const hits = this.index.search(query, {
      fields: {
        title: { boost: 2 },
        body: { boost: 1 },
      },
    });

    return hits.map(({ ref }) => this.index.documentStore.getDoc(ref));
  }

  render() {
    const { site } = this.props.data;
    const { query, hits } = this.state;
    const postList =
      hits.length > 0 ? <PostList posts={hits} site={site} /> : null;

    return (
      <RootLayout meta={site.siteMetadata} small>
        <input type="text" value={query} onChange={this.updateQuery} />
        {postList}
      </RootLayout>
    );
  }
}

Search.propTypes = {
  data: PropTypes.shape({
    site: PropTypes.shape({
      siteMetadata: PropTypes.shape({
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string.isRequired,
        siteUrl: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,

    blogSearchIndex: PropTypes.shape({
      index: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
};

export const pageQuery = graphql`
  query SearchPageQuery {
    blogSearchIndex {
      index
    }
    site {
      siteMetadata {
        title
        subtitle
        siteUrl
      }
    }
  }
`;
