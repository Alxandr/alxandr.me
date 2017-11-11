import React, { Component } from 'react';

import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './root.module.styl';
import throttle from 'raf-throttle';

class ScrollHandler extends Component {
  state = {
    zen: false,
    active: false,
  };

  handler = throttle(() => {
    const scroll =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (scroll > 260) {
      if (!this.state.zen) {
        this.setState(s => ({ ...s, zen: true }));
      }
    } else if (this.state.zen) {
      this.setState(s => ({ ...s, zen: false }));
    }
  });

  componentDidMount() {
    if (this.host) {
      document.addEventListener('scroll', this.handler, false);
      this.handler();
      this.setState(s => ({ ...s, active: true }));
    }
  }

  componentWillUnmount() {
    if (this.host) {
      document.removeEventListener('scroll', this.handler, false);
    }

    this.setState(s => ({ ...s, active: false }));
  }

  render() {
    return (
      <div
        className={styles.root}
        ref={e => {
          this.host = e;
        }}
      >
        {this.props.children({ ...this.state })}
      </div>
    );
  }
}

ScrollHandler.propTypes = {
  children: PropTypes.func.isRequired,
};

const RootLayout = ({ meta, children }) => (
  <ScrollHandler>
    {({ zen, active }) => {
      return [
        <div
          className={classnames(styles.topImage, {
            [styles.sticky]: zen,
            [styles.active]: active,
          })}
          key="topimage"
        >
          <div className={styles.topImageOverlay} />
        </div>,

        <header
          key="header"
          className={classnames(styles.header, {
            [styles.sticky]: zen,
            [styles.active]: active,
          })}
        >
          <h1 className={styles.title} itemProp="headline">
            <Link to="/">{meta.title}</Link>
          </h1>
          <p className={styles.subtitle} itemProp="alternativeHeadline">
            {meta.subtitle}
          </p>
        </header>,

        <div className={styles.main} key="main">
          <div className={styles.mainBg}>
            <div className={styles.content}>{children}</div>
          </div>
        </div>,
      ];
    }}
  </ScrollHandler>
);

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
  meta: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
  }).isRequired,
};

export default RootLayout;
