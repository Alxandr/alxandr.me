import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';

const Tags = ({ tags, ...rest }) => {
  if (tags.length === 0) return null;

  const arr = [];
  let first = true;
  for (const tag of tags) {
    if (!first) arr.push(', ');
    first = false;
    arr.push(
      <Link to={tag.path} key={tag.path}>
        {tag.name}
      </Link>,
    );
  }

  return (
    <span {...rest}>
      {arr}
    </span>
  );
};

Tags.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
};

export default Tags;
