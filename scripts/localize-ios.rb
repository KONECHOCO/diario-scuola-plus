# Adds <lang>.lproj/InfoPlist.strings (app name + permission texts) to the
# generated iOS project, so the app and the App Store list all 16 languages.
# Run on Codemagic after `npx cap add ios`: ruby scripts/localize-ios.rb
require 'json'
require 'xcodeproj'

root = File.expand_path('..', __dir__)
app_dir = File.join(root, 'ios/App/App')
project = Xcodeproj::Project.open(File.join(root, 'ios/App/App.xcodeproj'))
target = project.targets.find { |t| t.name == 'App' }
group = project.main_group.find_subpath('App', false)
strings = JSON.parse(File.read(File.join(__dir__, 'ios-strings.json')))

escape = ->(s) { s.gsub('\\', '\\\\\\\\').gsub('"', '\"') }

variant = group.children.find { |c| c.isa == 'PBXVariantGroup' && c.name == 'InfoPlist.strings' }
unless variant
  variant = project.new(Xcodeproj::Project::Object::PBXVariantGroup)
  variant.name = 'InfoPlist.strings'
  variant.source_tree = '<group>'
  group.children << variant
  target.resources_build_phase.add_file_reference(variant)
end

strings.each do |lang, values|
  dir = File.join(app_dir, "#{lang}.lproj")
  FileUtils.mkdir_p(dir)
  File.write(File.join(dir, 'InfoPlist.strings'), values.map { |k, v| %("#{k}" = "#{escape.call(v)}";) }.join("\n") + "\n")
  path = "#{lang}.lproj/InfoPlist.strings"
  next if variant.children.any? { |c| c.path == path }
  ref = project.new(Xcodeproj::Project::Object::PBXFileReference)
  ref.name = lang
  ref.path = path
  ref.last_known_file_type = 'text.plist.strings'
  ref.source_tree = '<group>'
  variant.children << ref
end

# @capgo/native-purchases requires iOS 15.
project.build_configurations.each { |c| c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0' }
target.build_configurations.each { |c| c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0' }

project.root_object.known_regions = (project.root_object.known_regions + strings.keys + ['Base']).uniq
project.root_object.development_region = 'en'
project.save
puts "Localized InfoPlist.strings for #{strings.keys.join(', ')}"
