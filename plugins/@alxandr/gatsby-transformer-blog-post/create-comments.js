const crypto = require('crypto');
const yaml = require('js-yaml');
const { createInternal } = require('./create-internal');

const fetchComments = async ({
  github,
  repo,
  owner,
  issue,
  createNode,
  post,
}) => {
  let response = await github.issues.getComments({
    owner,
    repo,
    number: issue,
    per_page: 100,
  });

  do {
    for (const comment of response.data) {
      const frontmatter = yaml
        .safeDump({
          key: `${owner}/${repo}/${comment.id}`,
          type: 'comment',
          post,
          created: comment.created_at,
          updated: comment.updated_at,
          link: comment.html_url,
          user: {
            name: comment.user.login,
            avatar: comment.user.avatar_url,
          },
        })
        .trim();
      const content = `---\n${frontmatter}\n---\n\n${comment.body}`;

      const node = {
        id: `GitHubComment < ${owner}/${repo}/${comment.id}`,
        parent: '___SOURCE___',
        children: [],
        internal: {
          mediaType: 'text/x-markdown',
          type: 'CommentMarkdown',
          content,
          contentDigest: crypto.createHash('md5').update(content).digest('hex'),
        },
      };

      createNode(node);
    }

    if (github.hasNextPage(response)) {
      response = await github.getNextPage(response);
    } else {
      response = null;
    }
  } while (response !== null);
};

exports.fetchComments = fetchComments;

const createComment = async ({
  aux,
  createNode,
  getNode,
  node,
  createParentChildLink,
}) => {
  const { frontmatter } = aux;
  const commentsNodeId = `Comments < ${frontmatter.post}`;
  const commentNode = Object.assign({}, frontmatter, {
    id: `Comment < ${frontmatter.key}`,
    children: [],
    parent: node.id,
    user: Object.assign({}, frontmatter.user),
  });

  commentNode.internal = createInternal('Comment', commentNode);

  const commentsNode = getNode(commentsNodeId);
  const comments = [
    ...((commentsNode && commentsNode.comments) || []),
    commentNode.id,
  ];
  const newCommentsNode = {
    id: commentsNodeId,
    children: [],
    parent: '___SOURCE___',
    comments,
  };

  newCommentsNode.internal = createInternal('Comments', newCommentsNode);

  createNode(commentNode);
  createNode(newCommentsNode);
  createParentChildLink({ parent: node, child: commentNode });
};

exports.createComment = createComment;
