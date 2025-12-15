class FeedItem {
  final int? id;
  final String type; // 'post', 'course', 'job'
  final String? title;
  final String? description;
  final List<FeedImage>? images;
  final String? publisherUsername;
  final String? publisherName;
  final String? publisherProfileImage;
  final String? timestamp;
  final DateTime? createdAt;
  
  // Course specific fields
  final String? courseImage;
  final String? level;
  final String? price;
  final String? currency;
  final String? startingDate;
  final String? endingDate;
  final String? city;
  final bool? isEnrolled;
  
  // Job specific fields
  final String? institution;
  
  FeedItem({
    this.id,
    required this.type,
    this.title,
    this.description,
    this.images,
    this.publisherUsername,
    this.publisherName,
    this.publisherProfileImage,
    this.timestamp,
    this.createdAt,
    this.courseImage,
    this.level,
    this.price,
    this.currency,
    this.startingDate,
    this.endingDate,
    this.city,
    this.isEnrolled,
    this.institution,
  });

  factory FeedItem.fromJson(Map<String, dynamic> json) {
    // Process images
    List<FeedImage>? images;
    if (json['images'] != null && json['images'] is List) {
      images = (json['images'] as List)
          .map((img) => FeedImage.fromJson(img))
          .toList();
    } else if (json['image'] != null) {
      images = [FeedImage.fromJson({'image': json['image']})];
    }

    // Process timestamp
    String? timestamp;
    DateTime? createdAt;
    if (json['created_at'] != null) {
      try {
        createdAt = DateTime.parse(json['created_at']);
        timestamp = _formatTimestamp(createdAt);
      } catch (e) {
        timestamp = json['created_at'].toString();
      }
    }

    // Get publisher info
    final publisherUsername = json['publisher_username'] ?? 
        json['institution_username'] ?? 
        json['institution']?['username'] ?? 
        json['username'];
    
    final publisherName = json['publisher_username'] ?? 
        json['institution_name'] ?? 
        json['institution']?['name'] ?? 
        json['institution']?['title'] ?? 
        json['institution_title'] ?? 
        json['name'] ?? 
        publisherUsername;

    final publisherProfileImage = json['publisher_profile_image'] ?? 
        json['institution_profile_image'] ?? 
        json['institution']?['profile_image'];

    return FeedItem(
      id: json['id'],
      type: json['type'] ?? 'post',
      title: json['title'],
      description: json['description'],
      images: images,
      publisherUsername: publisherUsername,
      publisherName: publisherName,
      publisherProfileImage: publisherProfileImage,
      timestamp: timestamp,
      createdAt: createdAt,
      courseImage: json['course_image'],
      level: json['level'],
      price: json['price'],
      currency: json['currency'],
      startingDate: json['starting_date'],
      endingDate: json['ending_date'],
      city: json['city'],
      isEnrolled: json['is_enrolled'],
      institution: json['institution'],
    );
  }

  static String _formatTimestamp(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes} ${diff.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} ${diff.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} ${diff.inDays == 1 ? 'day' : 'days'} ago';
    } else {
      return date.toLocal().toString().split(' ')[0];
    }
  }

  String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const baseUrl = 'http://192.168.0.249:8000';
    String cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    cleanPath = cleanPath.replaceAll(RegExp(r'/media/media+'), '/media/');
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replaceFirst('/media/media/', '/media/');
    }
    return '$baseUrl$cleanPath';
  }
}

class FeedImage {
  final String? image;

  FeedImage({this.image});

  factory FeedImage.fromJson(Map<String, dynamic> json) {
    return FeedImage(image: json['image']);
  }
}



