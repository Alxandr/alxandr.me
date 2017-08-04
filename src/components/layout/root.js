import React, { Component } from 'react';

import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import Styled from '../../utils/styled';
import background from './cover.jpg';
import classnames from 'classnames';
import throttle from 'raf-throttle';

const styleSheet = {
  root: {},

  topImage: {
    position: 'fixed',
    zIndex: -1,
    width: '100%',
    height: 500,
    background: `url(${background}) top left no-repeat #666`,
    backgroundSize: 'cover',
  },

  topImageOverlay: {
    backgroundColor: 'rgba(12, 12, 12, 0.7)',
    width: '100%',
    height: '100%',
    transition: 'background-color .2s',

    '$sticky &': {
      backgroundColor: 'white',
    },
  },

  header: {
    margin: 0,
    fontSize: '2.5rem',
    letterSpacing: '4px',
    color: '#fff',
    position: 'fixed',
    width: '100%',
    textAlign: 'center',
    paddingTop: '160px',
    top: 0,
    zIndex: 1,
    transition:
      'padding-top .2s, background-color .2s, color .2s, border-bottom .2s',

    '@media (max-width: 490px)': {
      fontSize: '1.5rem',
    },

    '&$sticky': {
      paddingTop: 20,
      backgroundColor: 'white',
      color: 'black',
      borderBottom: '1px solid #ddd',
    },
  },

  title: {
    margin: 0,
    fontSize: 'inherit',
    fontWeight: 300,
    letterSpacing: '4px',
    display: 'inline-block',
    borderBottom: '1px solid white',

    '& > a': {
      color: 'inherit',
      textDecoration: 'none',
      fontFamily: '"Roboto Slab", serif',
      fontWeight: 300,
    },
  },

  subtitle: {
    margin: 0,
    fontWeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: '0.3em',
  },

  main: {
    paddingTop: 530,
  },

  mainBg: {
    backgroundColor: 'white',
    padding: 20,
  },

  content: {
    maxWidth: 800,
    margin: '0 auto',
  },

  sticky: {},
};

class ScrollHandler extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      zen: false,
    };
    this.handler = throttle(() => {
      if (document.body.scrollTop > 260) {
        if (!this.state.zen) {
          this.setState(s => ({ ...s, zen: true }));
        }
      } else if (this.state.zen) {
        this.setState(s => ({ ...s, zen: false }));
      }
    });
  }

  componentDidMount() {
    if (this.host) {
      document.addEventListener('scroll', this.handler, false);
      this.handler();
    }
  }

  componentWillUnmount() {
    if (this.host) {
      document.removeEventListener('scroll', this.handler, false);
    }
  }

  render() {
    return (
      <Styled styles={styleSheet}>
        {classes =>
          <div
            className={classes.root}
            ref={e => {
              this.host = e;
            }}
          >
            {this.props.children({ classes, ...this.state })}
          </div>}
      </Styled>
    );
  }
}

ScrollHandler.propTypes = {
  children: PropTypes.func.isRequired,
};

const RootLayout = ({ meta, children }) =>
  <ScrollHandler>
    {({ zen, classes }) => {
      return [
        <div
          className={classnames(classes.topImage, { [classes.sticky]: zen })}
          key="topimage"
        >
          <div className={classes.topImageOverlay} />
        </div>,

        <header
          key="header"
          className={classnames(classes.header, {
            [classes.sticky]: zen,
          })}
        >
          <h1 className={classes.title} itemProp="headline">
            <Link to="/">
              {meta.title}
            </Link>
          </h1>
          <p className={classes.subtitle} itemProp="alternativeHeadline">
            {meta.subtitle}
          </p>
        </header>,

        <div className={classes.main} key="main">
          <div className={classes.mainBg}>
            <div className={classes.content}>
              {children}
            </div>
          </div>
        </div>,
      ];
    }}
  </ScrollHandler>;

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
  meta: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
  }).isRequired,
};

export default RootLayout;
