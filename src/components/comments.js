import DateTime from './date';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './comments.module.styl';

const commentShape = {
  id: PropTypes.string.isRequired,
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  created: PropTypes.string.isRequired,
  updated: PropTypes.string,
  link: PropTypes.string.isRequired,
  html: PropTypes.string.isRequired,
};

const Comment = ({ id, author, created, updated, link, html }) => (
  <div
    className={styles.comment}
    itemProp="comment"
    itemScope
    itemID={link}
    itemType="http://schema.org/Comment"
  >
    <img
      id={`${id}/img`}
      src={`${author.avatar}&s=88`}
      className={styles.image}
      itemProp="image"
    />
    <h5
      className={styles.author}
      itemProp="author"
      itemScope
      itemType="http://schema.org/Person"
      itemRef={`${id}/img`}
      itemID={author.url}
    >
      <a href={author.url} itemProp="url" className={styles.authorLink}>
        <span itemProp="name">{author.name}</span>
      </a>
    </h5>
    <span className={styles.created}>
      <a href={link}>
        <DateTime date={created} itemProp="dateCreated" />
        <DateTime
          date={updated}
          itemProp="dateModified"
          className={styles.hidden}
        />
      </a>
      {updated !== created && ' (updated)'}
    </span>
    <div
      className={styles.body}
      dangerouslySetInnerHTML={{ __html: html }}
      itemProp="text"
    />
  </div>
);

Comment.propTypes = {
  ...commentShape,

  classes: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
};

const Comments = ({ comments, url }) => {
  const children = [<hr key="comments-top-hr" className={styles.commentHr} />];

  for (let i = 0; i < comments.length; i++) {
    const { author, id, created, updated, link, html } = comments[i];

    if (i > 0) {
      children.push(<hr key={`before-${id}`} />);
    }

    children.push(
      <Comment
        author={author}
        key={id}
        created={created}
        updated={updated}
        link={link}
        html={html}
        id={id}
      />,
    );
  }

  return (
    <section className={styles.root}>
      <h2 className={styles.commentTitle}>
        <span>Comments</span>
        <a href={url} className={styles.leaveCommentLink}>
          Leave a comment
        </a>
      </h2>
      <a name="comments" />

      {children}
    </section>
  );
};

Comments.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      ...commentShape,
    }).isRequired,
  ).isRequired,

  url: PropTypes.string.isRequired,
};

export default Comments;
