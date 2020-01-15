import * as cdk from "@aws-cdk/core"

export function addStackTags(app: cdk.App, projectName: string) {
  app.node.applyAspect({
    visit(construct: cdk.IConstruct) {
      if (construct instanceof cdk.Construct) {
        const stack = construct.node.scopes.find(cdk.Stack.isStack)
        if (stack != null) {
          cdk.Tag.add(construct, "StackName", stack.stackName)
          cdk.Tag.add(construct, "project", projectName)
        }
      }
    },
  })
}
