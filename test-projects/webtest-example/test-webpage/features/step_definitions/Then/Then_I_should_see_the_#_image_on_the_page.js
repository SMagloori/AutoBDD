module.exports = function() {
  this.Then(/^I should see the "([^"]*)" image on the page$/, {timeout: process.env.StepTimeoutInMS}, function (imageName) {
    var imageFullPath = this.fs_session.getLocalThenGlobalImageFullPath(__dirname, imageName);
    var imageSimilarity = 0.8;
    console.log(imageFullPath);
    var resultString = this.screen_session.focusedFindImage(imageFullPath, imageSimilarity);
    expect(resultString).not.toContain('not found');
    expect(resultString).not.toContain('error');
    var resultArray = JSON.parse(resultString);
    console.log(resultArray[0].location)
  });
};
