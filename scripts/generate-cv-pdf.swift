import AppKit
import PDFKit
import WebKit

final class PDFRenderer: NSObject, WKNavigationDelegate {
    var loaded = false

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        loaded = true
    }
}

guard CommandLine.arguments.count == 3 else {
    fatalError("Usage: swift scripts/generate-cv-pdf.swift <html-file> <output-pdf>")
}

let htmlURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 794, height: 1123))
let renderer = PDFRenderer()
webView.navigationDelegate = renderer
webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())

let loadDeadline = Date().addingTimeInterval(30)
while !renderer.loaded && Date() < loadDeadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
guard renderer.loaded else { fatalError("Timed out loading CV HTML") }

var siteRocketPageBreak: CGFloat?
webView.evaluateJavaScript("document.querySelectorAll('article.job')[1].querySelector('ul > li').getBoundingClientRect().bottom + window.scrollY") { value, _ in
    if let value = value as? NSNumber {
        siteRocketPageBreak = CGFloat(truncating: value)
    }
}
let measureDeadline = Date().addingTimeInterval(10)
while siteRocketPageBreak == nil && Date() < measureDeadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
guard let siteRocketPageBreak else { fatalError("Could not find the SiteRocket page break") }

var renderedData: Data?
var renderError: Error?
webView.createPDF(configuration: WKPDFConfiguration()) { result in
    switch result {
    case .success(let data): renderedData = data
    case .failure(let error): renderError = error
    }
}

let renderDeadline = Date().addingTimeInterval(30)
while renderedData == nil && renderError == nil && Date() < renderDeadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
if let renderError { fatalError("Could not render CV HTML: \(renderError)") }
guard let renderedData, let document = PDFDocument(data: renderedData),
      let sourcePage = document.page(at: 0), let sourceRef = sourcePage.pageRef else {
    fatalError("Could not read rendered CV PDF")
}

let sourceBounds = sourcePage.bounds(for: .mediaBox)
let outputSize = CGSize(width: 595.28, height: 841.89)
let scale = outputSize.width / sourceBounds.width
let sourceSliceHeight = outputSize.height / scale
let segments = [(CGFloat(0), siteRocketPageBreak), (siteRocketPageBreak, sourceBounds.height - siteRocketPageBreak)]
guard segments.allSatisfy({ $0.1 <= sourceSliceHeight }) else {
    fatalError("CV sections exceed the available A4 page height")
}
var outputBounds = CGRect(origin: .zero, size: outputSize)
guard let consumer = CGDataConsumer(url: outputURL as CFURL),
      let output = CGContext(consumer: consumer, mediaBox: &outputBounds, nil) else {
    fatalError("Could not create output PDF")
}

for (topOffset, segmentHeight) in segments {
    output.beginPDFPage(nil)
    output.saveGState()
    output.clip(to: CGRect(x: 0, y: outputSize.height - segmentHeight * scale, width: outputSize.width, height: segmentHeight * scale))
    output.translateBy(x: 0, y: outputSize.height - (sourceBounds.height - topOffset) * scale)
    output.scaleBy(x: scale, y: scale)
    output.drawPDFPage(sourceRef)
    output.restoreGState()
    output.endPDFPage()
}
output.closePDF()