import BlogPostList, { dataShape, pathContextShape } from './list';

import PropTypes from 'prop-types';
import React from 'react';
import graphql from 'graphql';

const TagListTemplate = ({ data, pathContext }) =>
  <BlogPostList
    data={data}
    pathContext={pathContext}
    title={`Tag: ${data.tag.name}`}
  >
    <h1>
      Tag: {data.tag.name}
    </h1>
  </BlogPostList>;

TagListTemplate.propTypes = {
  data: PropTypes.shape({
    ...dataShape,
    tag: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  pathContext: PropTypes.shape(pathContextShape).isRequired,
};

export default TagListTemplate;

export const pageQuery = graphql`
  query TagBlogPosts($limit: Int!, $skip: Int!, $tag: String!) {
    tag(id: { eq: $tag }) {
      name
      slug
    }
    allBlogPost(
      skip: $skip
      limit: $limit
      sort: { order: DESC, fields: [date] }
      filter: { tags: { eq: $tag } }
    ) {
      edges {
        node {
          id
          title
          excerpt(pruneLength: 250)
          date
          path
          tags {
            name
            path
          }
        }
      }
    }
    site {
      siteMetadata {
        title
        subtitle
      }
    }
  }
`;
