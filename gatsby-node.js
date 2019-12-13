const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { fluid } = require(`gatsby-plugin-sharp`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const result = await graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

exports.createResolvers = ({ createResolvers, reporter, cache, }) => {
  createResolvers({
    MarkdownRemark: {
      previewImage: {
        type: `JSON`,
        args: {
          maxWidth: `Int`,
          maxHeight: `Int`,
        },
        resolve(remark, args, context) {
          const file = context.nodeModel.getAllNodes({ type: `File` })
              .find(file => file.extension === 'png')
          if (!file) {
            return null
          }
          const duotone = {
            highlight: remark.frontmatter.color,
            shadow: "#222222",
            ...args.duotone,
          }
          return fluid({ file, args: { ...args, duotone }, reporter, cache })
        }
      }
    }
  })
}
