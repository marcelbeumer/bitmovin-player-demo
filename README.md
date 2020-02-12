# Bitmovin Adaptive Streaming Player for MPEG-DASH & HLS
This showcases are build around the Bitmovin Adaptive Streaming Player, demonstrating usage and capabilities of the HTML5 based HLS and MPEG-DASH player, as well as the Flash based fallback.

![Bitmovin Player Demo](images/background.png?style=centerme "Bitmovin HTML5 Player Demo Page")

## Demos
* [**adaptation**](adaptation/)
    * [preferredStartupQuality](adaptation/preferredStartupQuality.js): Set a minimum startup quality for a specified amount of time before using the built-in adaptation logic again.
    * [regionOfInterest](adaptation/regionOfInterest.html): Multiple players with low quality and the active player (where the mouse is over) switches to better quality.
    * [rateBasedSwitching](adaptation/rateBasedSwitching.js): Measuring the speed of downloads and select the quality accordingly.
* [**castReceiver**](castReceiver/)
    * [receiverApp](castReceiver/receiverApp.html): Example of a custom receiver app.
* [**errorHandling**](errorhandling/)
    * [handleDownloadErrors](errorhandling/handleDownloadErrors.html): Custom retry logic for the case that files cannot be downloaded.
    * [showPosterOnError](errorhandling/showPosterOnError.html): Display a still image whenever an error occurs.
    * [switchQualityOnHttpStatusCode](errorhandling/switchQualityOnHttpStatusCode.html): Tweak the ABR behavior based on HTTP errors.
* [**events**](events/)
    * [ON_DOWNLOAD_FINISHED](events/onDownloadFinished.html): Report download errors for live streams using the ON_DOWNLOAD_FINISHED player event.
    * [eventConstants](events/eventConstants.html): Use event constants for registering event handlers at the player.
    * [ON_SEGMENT_REQUEST_FINISHED](events/onSegmentRequestFinished.html): Use ON_SEGMENT_REQUEST_FINISHED event to analyze which segment has been downloaded and implement custom workflows according to the HTTP status code.
* [**frameaccurate**](frameaccurate/)
    * [Frame Accurate Control](frameaccurate/js/FrameAccurateControls.ts): Bitmovin Player Wrapper for SMTPE timestamp seeking + stepping
* [**keyboard**](keyboard/)
   * [keyboardSupport](keyboard/keyboardSupport.html): Keyboard shortcuts for the Bitmovin Player.
   * [keyboardCustom](keyboard/keyboardCustom.html): Custom keyboard shortcuts for the Bitmovin Player.
* [**mobile**](mobile/)
   * [android MediaSessionAPI](mobile/androidMediaSessionAPI.html): Control playback via Android Notifications
* [**playerUi**](playerUi/)
   * [customErrorMessage](playerUi/customErrorMessage.html): Display your own error messages within the Bitmovin HTML5 Player
   * [timelineMarkers](playerUi/timelineMarkers.html): Identify the differents parts of a stream by setting some markers over the timeline
   * [separatedSubtitleAudioSettings](playerUi/separatedAudioSubtitleSettings.html): Extracted audio tracks and subtitle settings from the settings panel direct into the controlBar
   * [labeling](playerUi/labeling.html): Change Languages, Quality and Subtitles labels
* [**react**](react/)
    * [reactJs](react/reactjs.html): Using the Bitmovin Player within a react component
* [**playlist**](playlist/)
    * [simplePlaylist](playlist/simplePlaylist.html): Build a playlist with the Bitmovin HTML5 Player API.
* [**requirejs-demo**](requirejs-demo/)
    * [buildPlayerWithRequirejs](requirejs-demo/buildPlayerWithRequirejs.html): Build the Bitmovin HTML5 Player using requirejs.
* [**streamRecovery**](streamRecovery/)
    * [liveStreamRecovery](streamRecovery/liveStreamRecovery.js): Automatically restart live streams if too many download errors happened e.g. to get over missing segments.
* [**ssai**](ssai/)
    * [dfp](ssai/dfp/): Use Google DoubleClick for Server-side ad insertion (SSAI)
* [**subtitles**](subtitles/)
    * [customSubtitleDisplay](subtitles/customSubtitleDisplay.js): Render subtitles using the ON_CUE_ENTER and ON_CUE_EXIT player events.
* [**vue**](vue)
    * [vueJs](vue/vuejs.html): Using the Bitmovin Player within a vue.js component
* [**webpack-demo**](webpack-demo/)
    * [buildPlayerWithWebpack](webpack-demo/buildPlayerWithWebpack.html): Build the Bitmovin HTML5 Player using webpack.

## How to Install

1. [Sign up](https://bitmovin.com/dashboard/signup) for free
2. Get your personal key from the [player licenses page](https://bitmovin.com/dashboard/player/licenses/)
3. Checkout the sample provided in this repository
4. Add the player key to the player configuration in the example you want to use
5. Enjoy best adaptive streaming performance!

## Generate Content The Easy Way

To generate MPEG-DASH & HLS content on your own, please have a look at the [encoding section](https://bitmovin.com/docs/encoding) and give it a free try!

## Additional Demos and Documentation

Additional demos can be found in our [demo area](https://bitmovin.com/demos/). For more information on our rich API and player configuration, we refer to our [documentation](https://bitmovin.com/docs/player).

[www.bitmovin.com](https://www.bitmovin.com)<br>
